/* Lecture 9: 底盘概述 —— 本讲新增的交互零件
   1) 控制框架总图的分步点亮（一张 SVG，按步累加点亮）
   2) 可交互小车：调节 (vx, vy, ω)，实时画出四个轮组的和矢量 v0 = v + ω × r */
(function () {
  'use strict';

  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  /* ------------------------------------------------ 框架总图：分步点亮 */
  function initFlow(root) {
    $$('[data-flow]', root).forEach(function (box) {
      var nodes = $$('[data-at]', box);
      var steps = $$('.fc-step', box);
      if (!steps.length) { return; }
      var counter = box.querySelector('.fc-counter');
      var index = 0;

      var render = function () {
        nodes.forEach(function (n) {
          var at = Number(n.getAttribute('data-at'));
          n.classList.toggle('is-on', at === index);
          n.classList.toggle('is-past', at < index);
        });
        steps.forEach(function (s, i) {
          s.classList.toggle('is-active', i === index);
          s.classList.toggle('is-past', i < index);
        });
        if (counter) {
          counter.textContent = ('0' + (index + 1)).slice(-2) + ' / ' + ('0' + steps.length).slice(-2);
        }
      };

      steps.forEach(function (s, i) {
        s.addEventListener('click', function () { index = i; render(); });
      });

      var prev = box.querySelector('[data-flow="prev"]');
      var next = box.querySelector('[data-flow="next"]');
      if (prev) {
        prev.addEventListener('click', function () {
          index = (index - 1 + steps.length) % steps.length;
          render();
        });
      }
      if (next) {
        next.addEventListener('click', function () {
          index = (index + 1) % steps.length;
          render();
        });
      }
      render();
    });
  }

  /* ---------------------------------------------------------- 可交互小车 */
  var NS = 'http://www.w3.org/2000/svg';

  function svgEl(name, attrs) {
    var e = document.createElementNS(NS, name);
    Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  function fmt(v, d) {
    var s = v.toFixed(d === undefined ? 2 : d);
    return s === '-0.00' || s === '-0.0' ? s.slice(1) : s;
  }

  function initCar(root) {
    $$('[data-car]', root).forEach(function (box) {
      var svg = box.querySelector('svg');
      var layer = svg && svg.querySelector('[data-layer]');
      var inputs = $$('[data-k]', box);
      if (!svg || !layer) { return; }

      var CX = 330, CY = 240;      /* 车体中心（SVG 坐标，y 向下） */
      var PPM = 380;               /* 每米像素 */
      var VSCALE = 96;             /* 每 (m/s) 像素 */
      var A = 0.30, B = 0.26;      /* 轮组到中心：纵向 a、横向 b（米） */
      var wheels = [
        { name: '右前轮', rx: A, ry: -B },
        { name: '左前轮', rx: A, ry: B },
        { name: '左后轮', rx: -A, ry: B },
        { name: '右后轮', rx: -A, ry: -B }
      ];

      var read = function () {
        var o = {};
        inputs.forEach(function (i) {
          var k = i.getAttribute('data-k');
          o[k] = parseFloat(i.value);
          var out = i.parentNode.querySelector('output');
          if (out) { out.textContent = fmt(o[k], 2); }
        });
        return o;
      };

      var arrow = function (x1, y1, x2, y2, color, width) {
        return svgEl('line', {
          x1: x1, y1: y1, x2: x2, y2: y2,
          stroke: color, 'stroke-width': width || 2.6,
          'stroke-linecap': 'round',
          'marker-end': color === '#b3121b' ? 'url(#car-arrow-r)' : 'url(#car-arrow-k)'
        });
      };

      var render = function () {
        var v = read();
        var tx = CX + v.vx * VSCALE;
        var ty = CY - v.vy * VSCALE;

        while (layer.firstChild) { layer.removeChild(layer.firstChild); }

        if (Math.abs(v.vx) > 1e-6 || Math.abs(v.vy) > 1e-6) {
          layer.appendChild(arrow(CX, CY, tx, ty, '#14161a', 2.2));
          var t = svgEl('text', { x: tx + 6, y: ty - 6, 'font-size': '13', fill: '#14161a' });
          t.textContent = 'v';
          layer.appendChild(t);
        }

        var rows = [];
        wheels.forEach(function (w) {
          var wx = CX + w.rx * PPM;
          var wy = CY - w.ry * PPM;
          var v0x = v.vx - v.w * w.ry;
          var v0y = v.vy + v.w * w.rx;
          var mag = Math.sqrt(v0x * v0x + v0y * v0y);

          if (mag > 1e-6) {
            layer.appendChild(arrow(wx, wy, wx + v0x * VSCALE, wy - v0y * VSCALE, '#b3121b', 2.6));
          }
          layer.appendChild(svgEl('circle', { cx: wx, cy: wy, r: 4.5, fill: '#14161a' }));
          rows.push({ name: w.name, vx: v0x, vy: v0y, mag: mag });
        });

        var out = box.querySelector('[data-car-out]');
        if (out) {
          out.innerHTML = rows.map(function (r) {
            return '<div class="car-line"><span>' + r.name + '</span><b>(' + fmt(r.vx) + ', ' + fmt(r.vy) +
              ')</b><em>|v₀| = ' + fmt(r.mag) + '</em></div>';
          }).join('');
        }
      };

      inputs.forEach(function (i) { i.addEventListener('input', render); });
      render();
    });
  }

  /* ------------------------------------------------- 麦轮 3D 速度分解模型
     一页手写投影的三维场景：把四个轮组接触点的速度 v0 拆成
       u（沿辊轴的驱动方向，轮子必须滚）与 g（辊子自由方向，轮子在这里滑）。
     不依赖任何三维库，只有 canvas 2D + 透视投影 + 画家算法。 */

  var initM3D = (function () {
    'use strict';

    var K2 = Math.SQRT1_2;              /* √2 / 2 */
    var LA = 0.30, LB = 0.26;           /* 轮组位置：纵向 a、横向 b（米） */
    var RW = 0.058, WH = 0.055;         /* 轮半径、轮宽（米） */
    var VS = 0.14;                      /* 1 m/s 画成多少米 */
    var SPIN = 0.5;                     /* 轮子转速的视觉比例 */

    var WHEELS = [
      { sx: 1, sy: 1, name: '左前轮', fx: '(v<sub>x</sub> − v<sub>y</sub> − ω(a+b)) / r' },
      { sx: 1, sy: -1, name: '右前轮', fx: '(v<sub>x</sub> + v<sub>y</sub> + ω(a+b)) / r' },
      { sx: -1, sy: 1, name: '左后轮', fx: '(v<sub>x</sub> + v<sub>y</sub> − ω(a+b)) / r' },
      { sx: -1, sy: -1, name: '右后轮', fx: '(v<sub>x</sub> − v<sub>y</sub> + ω(a+b)) / r' }
    ];

    var COL = {
      plateTop: '#eef1f5', plateSide: '#d6dbe2', plateEdge: '#b9c0c8',
      hub: '#b9c2cb', roller: '#333a42', cap: '#6f7984',
      ground: '#f8fafb', grid: '#e7ebef', gridMain: '#d3d9e0',
      ink: '#14161a', red: '#b3121b', free: '#a8620a', mute: '#7c848f', guide: '#c3c9d1'
    };

    /* ---------------------------------------------------------- 向量小工具 */
    function V(x, y, z) { return { x: x, y: y, z: z }; }
    function vAdd(a, b) { return V(a.x + b.x, a.y + b.y, a.z + b.z); }
    function vMul(a, s) { return V(a.x * s, a.y * s, a.z * s); }
    function vSub(a, b) { return V(a.x - b.x, a.y - b.y, a.z - b.z); }
    function vDot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
    function vCross(a, b) {
      return V(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
    }
    function vUnit(a) {
      var l = Math.sqrt(vDot(a, a)) || 1;
      return V(a.x / l, a.y / l, a.z / l);
    }

    function tint(hex, k) {
      var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
      r = Math.max(0, Math.min(255, Math.round(r * k)));
      g = Math.max(0, Math.min(255, Math.round(g * k)));
      b = Math.max(0, Math.min(255, Math.round(b * k)));
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    }

    var LIGHT = vUnit(V(0.55, 0.35, 0.95));

    /* 轮组几何：由位置符号推出两个 45° 方向，与 A 矩阵的符号一一对应 */
    function wheelState(i, s) {
      var w = WHEELS[i];
      var rx = w.sx * LA, ry = w.sy * LB;
      var v0x = s.vx - s.w * ry;
      var v0y = s.vy + s.w * rx;
      var k = w.sx * w.sy;
      var ux = K2, uy = -k * K2;                        /* u：驱动方向 = 辊轴方向 */
      var gx = K2, gy = k * K2;                         /* g：辊子自由方向，与 u 垂直 */
      var vp = v0x * ux + v0y * uy;                     /* 驱动分量 */
      return {
        w: w, rx: rx, ry: ry, v0x: v0x, v0y: v0y,
        ux: ux, uy: uy, gx: gx, gy: gy,
        vp: vp, vg: v0x * gx + v0y * gy,
        omega: Math.SQRT2 * vp / RW
      };
    }

    function attach(box) {
      var canvas = box.querySelector('canvas');
      if (!canvas) { return; }
      var ctx = canvas.getContext('2d');
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var W = 0, H = 0, k = 1;
      var need = true, last = 0;

      var s = {
        vx: 1, vy: 0, w: 0, sel: 0,
        yaw: 0.96, pitch: 0.58, zoom: 1.42, dist: 1.42,
        spin: [0, 0, 0, 0], slip: [0, 0, 0, 0], live: true
      };

      /* -------------------------------------------------------- 相机与投影 */
      function camCenter() {
        var sel = WHEELS[s.sel];
        return V(sel.sx * LA * 0.12, sel.sy * LB * 0.12, 0.085);
      }

      /* 必看点：四个轮子的外廓 + 选中轮组的接触点与三条箭头的端点 */
      function keyPoints() {
        var st = wheelState(s.sel, s);
        var z = 0.002;
        var pts = [];
        WHEELS.forEach(function (w) {
          var px = w.sx * LA, py = w.sy * LB;
          pts.push(V(px, py, 0));
          pts.push(V(px, py, 2 * RW));
          pts.push(V(px, py - WH / 2, RW));
          pts.push(V(px, py + WH / 2, RW));
        });
        pts.push(V(st.rx + st.vp * VS * st.ux, st.ry + st.vp * VS * st.uy, z));
        pts.push(V(st.rx + st.vg * VS * st.gx, st.ry + st.vg * VS * st.gy, z));
        pts.push(V(st.rx + st.v0x * VS, st.ry + st.v0y * VS, z));
        return pts;
      }

      function buildCam() {
        var t = camCenter();
        var cp = Math.cos(s.pitch), sp = Math.sin(s.pitch);
        var focal = H / (2 * Math.tan(0.225));
        var cx = W * 0.5, cy = H * 0.47;
        var fwd = vUnit(V(-cp * Math.cos(s.yaw), -cp * Math.sin(s.yaw), -sp));
        var right = vUnit(vCross(fwd, V(0, 0, 1)));
        var up = vCross(right, fwd);
        /* 按内容自动拉远，保证箭头与文字不出画 */
        var m = 34;
        var xLimit = Math.max(50, cx - m);
        var yUp = Math.max(50, cy - m), yDown = Math.max(50, H - cy - m);
        var need = 0;
        keyPoints().forEach(function (p) {
          var d = vSub(p, t);
          var fz = vDot(d, fwd);
          var yc = vDot(d, up);
          var yLim = yc >= 0 ? yUp : yDown;
          need = Math.max(need,
            focal * Math.abs(vDot(d, right)) / xLimit - fz,
            focal * Math.abs(yc) / yLim - fz);
        });
        s.dist = Math.max(s.zoom, need);
        return {
          eye: V(t.x + s.dist * cp * Math.cos(s.yaw),
            t.y + s.dist * cp * Math.sin(s.yaw),
            t.z + s.dist * sp),
          fwd: fwd, right: right, up: up, focal: focal, cx: cx, cy: cy
        };
      }

      function P(c, p) {
        var d = vSub(p, c.eye);
        var z = vDot(d, c.fwd);
        if (z < 0.12) { return null; }
        var f = c.focal / z;
        return { x: c.cx + vDot(d, c.right) * f, y: c.cy - vDot(d, c.up) * f, z: z };
      }

      function resize() {
        var rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) { return false; }
        var cw = canvas.clientWidth || rect.width;
        var ch = canvas.clientHeight || rect.height;
        var bw = Math.round(rect.width * dpr), bh = Math.round(rect.height * dpr);
        if (canvas.width !== bw || canvas.height !== bh) {
          canvas.width = bw;
          canvas.height = bh;
        }
        W = cw; H = ch; k = bw / cw;
        return true;
      }

      /* ------------------------------------------------------------ 图元 */
      function poly(list, c, pts, fill, stroke) {
        var out = [], z = 0, i, pp;
        for (i = 0; i < pts.length; i++) {
          pp = P(c, pts[i]);
          if (!pp) { return; }
          out.push(pp);
          z += pp.z;
        }
        list.push({ t: 'p', z: z / pts.length, pts: out, fill: fill, stroke: stroke || fill });
      }

      function seg(list, c, a, b, color, lw) {
        var pa = P(c, a), pb = P(c, b);
        if (!pa || !pb) { return; }
        list.push({ t: 'l', z: (pa.z + pb.z) / 2, a: pa, b: pb, c: color, lw: lw || 1 });
      }

      /* ---------------------------------------------------------- 地面与网格 */
      function drawGround(c) {
        var quad = [V(-0.78, -0.78, 0), V(0.78, -0.78, 0), V(0.78, 0.78, 0), V(-0.78, 0.78, 0)];
        var pts = [], ok = true, i, p;
        for (i = 0; i < 4; i++) {
          p = P(c, quad[i]);
          if (!p) { ok = false; break; }
          pts.push(p);
        }
        if (ok) {
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (i = 1; i < 4; i++) { ctx.lineTo(pts[i].x, pts[i].y); }
          ctx.closePath();
          ctx.fillStyle = COL.ground;
          ctx.fill();
        }
        ctx.lineWidth = 1;
        for (i = -6; i <= 6; i++) {
          var t = i * 0.1;
          ctx.strokeStyle = i === 0 ? COL.gridMain : COL.grid;
          line2(c, V(t, -0.6, 0), V(t, 0.6, 0));
          line2(c, V(-0.6, t, 0), V(0.6, t, 0));
        }
        /* 轮组落影与选中框 */
        WHEELS.forEach(function (w, wi) {
          var cxw = w.sx * LA, cyw = w.sy * LB;
          var pts2 = [];
          for (var q = 0; q < 18; q++) {
            var qa = q * Math.PI * 2 / 18;
            var pp2 = P(c, V(cxw + RW * 1.1 * Math.cos(qa), cyw + RW * 0.62 * Math.sin(qa), 0.0008));
            if (!pp2) { return; }
            pts2.push(pp2);
          }
          ctx.beginPath();
          ctx.moveTo(pts2[0].x, pts2[0].y);
          for (var q2 = 1; q2 < pts2.length; q2++) { ctx.lineTo(pts2[q2].x, pts2[q2].y); }
          ctx.closePath();
          ctx.fillStyle = 'rgba(20,22,26,0.07)';
          ctx.fill();
        });

        var st = wheelState(s.sel, s);
        ctx.strokeStyle = 'rgba(179,18,27,0.45)';
        ctx.lineWidth = 1.6;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        var started = false;
        for (i = 0; i <= 28; i++) {
          var a = i * Math.PI * 2 / 28;
          var pp = P(c, V(st.rx + RW * 1.75 * Math.cos(a), st.ry + RW * 1.75 * Math.sin(a), 0.002));
          if (!pp) { started = false; continue; }
          if (!started) { ctx.moveTo(pp.x, pp.y); started = true; } else { ctx.lineTo(pp.x, pp.y); }
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      function line2(c, a, b) {
        var pa = P(c, a), pb = P(c, b);
        if (!pa || !pb) { return; }
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      }

      /* -------------------------------------------------------------- 车体 */
      function addChassis(list, c) {
        var lx = 0.225, ly = 0.205, z0 = 0.070, z1 = 0.084;
        var top = [V(-lx, -ly, z1), V(lx, -ly, z1), V(lx, ly, z1), V(-lx, ly, z1)];
        poly(list, c, top, tint(COL.plateTop, 1.0), COL.plateEdge);
        var faces = [
          [V(lx, -ly, z1), V(lx, ly, z1), V(lx, ly, z0), V(lx, -ly, z0)],
          [V(-lx, ly, z1), V(-lx, -ly, z1), V(-lx, -ly, z0), V(-lx, ly, z0)],
          [V(-lx, -ly, z1), V(lx, -ly, z1), V(lx, -ly, z0), V(-lx, -ly, z0)],
          [V(lx, ly, z1), V(-lx, ly, z1), V(-lx, ly, z0), V(lx, ly, z0)]
        ];
        faces.forEach(function (f, i) {
          poly(list, c, f, tint(COL.plateSide, i % 2 ? 0.94 : 1.02), COL.plateEdge);
        });
        /* 车头标记：前缘一条红线 */
        seg(list, c, V(lx - 0.008, -ly + 0.03, z1 + 0.0005), V(lx - 0.008, ly - 0.03, z1 + 0.0005), COL.red, 2.6);
        /* 轮轴 */
        WHEELS.forEach(function (w) {
          var px = w.sx * LA, py = w.sy * LB;
          seg(list, c, V(px, py - Math.sign(py) * WH / 2, RW), V(px, Math.sign(py) * ly, RW), '#8e98a3', 5);
        });
      }

      /* ---------------------------------------------------------- 麦轮本体 */
      /* 一根辊子：斜置的小圆柱，沿 axis 方向，走一半深一半浅用来表现它自己在转 */
      function addRoller(list, c, ctr, axis, rad, half, segs, base, phase) {
        var ax = vUnit(axis);
        var ref = Math.abs(ax.z) > 0.9 ? V(0, 1, 0) : V(0, 0, 1);
        var e1 = vUnit(vCross(ax, ref));
        var e2 = vCross(ax, e1);
        var p1 = vSub(ctr, vMul(ax, half)), p2 = vAdd(ctr, vMul(ax, half));
        var r1 = [], r2 = [], nrm = [], k, a, d;
        for (k = 0; k < segs; k++) {
          a = k * 2 * Math.PI / segs;
          d = vAdd(vMul(e1, Math.cos(a) * rad), vMul(e2, Math.sin(a) * rad));
          r1.push(vAdd(p1, d));
          r2.push(vAdd(p2, d));
          nrm.push(vUnit(d));
        }
        for (k = 0; k < segs; k++) {
          var k2 = (k + 1) % segs;
          var lit = 0.58 + 0.42 * Math.max(0, vDot(vUnit(vAdd(nrm[k], nrm[k2])), LIGHT));
          var tone = Math.cos((k + 0.5) * 2 * Math.PI / segs + phase) > 0 ? 1 : 0.66;
          poly(list, c, [r1[k], r1[k2], r2[k2], r2[k]], tint(base, tone * lit));
        }
        poly(list, c, r1, tint(base, 0.74));
        poly(list, c, r2, tint(base, 0.92));
      }

      function addWheel(list, c, i) {
        var w = WHEELS[i];
        var px = w.sx * LA, py = w.sy * LB;
        var phi = s.spin[i], slip = s.slip[i];
        /* 辊子脊线的走向 = 该轮组的驱动方向 û = (1, −sx·sy)/√2；
           四个轮组各按自己的 û 画，俯视才会是统一的 O/X 花样（旋向取反＝装反） */
        var kk = w.sx * w.sy;
        var hw = WH / 2, NS = 40, NU = 6, NST = 5;
        var pitch = 2 * Math.PI / NST;
        for (var a = 0; a < NS; a++) {
          var t0 = a * 2 * Math.PI / NS, t1 = (a + 1) * 2 * Math.PI / NS;
          for (var b = 0; b < NU; b++) {
            var u0 = -hw + b * WH / NU, u1 = -hw + (b + 1) * WH / NU;
            var tm = (t0 + t1) / 2, um = (u0 + u1) / 2;
            var nrm = V(Math.cos(tm), 0, Math.sin(tm));
            var lit = 0.58 + 0.42 * Math.max(0, vDot(nrm, LIGHT));
            var ph = (tm + phi + kk * (um - slip) / RW) / pitch;
            var groove = ph - Math.floor(ph) < 0.18;
            poly(list, c, [
              V(px + RW * Math.cos(t0), py + u0, RW + RW * Math.sin(t0)),
              V(px + RW * Math.cos(t1), py + u0, RW + RW * Math.sin(t1)),
              V(px + RW * Math.cos(t1), py + u1, RW + RW * Math.sin(t1)),
              V(px + RW * Math.cos(t0), py + u1, RW + RW * Math.sin(t0))
            ], tint(groove ? COL.roller : COL.hub, lit));
          }
        }
        [-hw, hw].forEach(function (u) {
          var pts = [], n = 18;
          for (var j = 0; j < n; j++) {
            var t = j * 2 * Math.PI / n;
            pts.push(V(px + RW * 0.99 * Math.cos(t), py + u * 1.05, RW + RW * 0.99 * Math.sin(t)));
          }
          poly(list, c, pts, tint(COL.cap, u > 0 ? 1.08 : 0.88));
        });
      }

      /* ------------------------------------------------------ 覆盖层：箭头 */
      function arrow(c, from, to, color, lw, label, align) {
        var pa = P(c, from), pb = P(c, to);
        if (!pa || !pb) { return; }
        var dx = pb.x - pa.x, dy = pb.y - pa.y;
        var len = Math.sqrt(dx * dx + dy * dy);
        if (len < 2) { return; }
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
        if (len > 7) {
          var ang = Math.atan2(dy, dx), head = Math.min(11, len * 0.42);
          ctx.beginPath();
          ctx.moveTo(pb.x, pb.y);
          ctx.lineTo(pb.x - head * Math.cos(ang - 0.42), pb.y - head * Math.sin(ang - 0.42));
          ctx.lineTo(pb.x - head * Math.cos(ang + 0.42), pb.y - head * Math.sin(ang + 0.42));
          ctx.closePath();
          ctx.fillStyle = color;
          ctx.fill();
        }
        if (label) {
          var nx = -dy / len, ny = dx / len;
          text(pb.x + (dx / len) * 11 + nx * 4, pb.y + (dy / len) * 11 + ny * 4 + 5, label, color, 'center', 13, 700);
        }
      }

      function text(x, y, str, color, align, size, weight) {
        ctx.font = (weight || 600) + ' ' + (size || 12.5) + 'px "Microsoft YaHei", "DengXian", sans-serif';
        ctx.textAlign = align || 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.lineWidth = 3.4;
        ctx.strokeStyle = 'rgba(255,255,255,0.92)';
        ctx.lineJoin = 'round';
        ctx.strokeText(str, x, y);
        ctx.fillStyle = color;
        ctx.fillText(str, x, y);
        ctx.textAlign = 'left';
      }

      function dashed(c, a, b, color, lw) {
        var pa = P(c, a), pb = P(c, b);
        if (!pa || !pb) { return; }
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = color;
        ctx.lineWidth = lw || 1.2;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
        ctx.restore();
      }

      function drawVectors(c) {
        var st = wheelState(s.sel, s);
        var z = 0.002;
        var O = V(st.rx, st.ry, z);
        var arm = 0.175;
        var uTip = V(st.rx + st.ux * arm, st.ry + st.uy * arm, z);
        var uTip2 = V(st.rx - st.ux * arm, st.ry - st.uy * arm, z);
        var gTip = V(st.rx + st.gx * arm, st.ry + st.gy * arm, z);
        var gTip2 = V(st.rx - st.gx * arm, st.ry - st.gy * arm, z);

        /* 两个 45° 方向（浅灰虚线） */
        dashed(c, uTip2, uTip, COL.guide, 1.3);
        dashed(c, gTip2, gTip, COL.guide, 1.3);

        /* 分解分量 */
        var vu = V(st.rx + st.vp * VS * st.ux, st.ry + st.vp * VS * st.uy, z);
        var vg = V(st.rx + st.vg * VS * st.gx, st.ry + st.vg * VS * st.gy, z);
        var v0 = V(st.rx + st.v0x * VS, st.ry + st.v0y * VS, z);
        dashed(c, vu, v0, COL.guide, 1.2);
        dashed(c, vg, v0, COL.guide, 1.2);

        arrow(c, O, vu, COL.red, 3.2, Math.abs(st.vp) > 0.08 ? 'v∥' : '', 'left');
        arrow(c, O, vg, COL.free, 2.6, Math.abs(st.vg) > 0.08 ? 'v⊥' : '', 'left');
        arrow(c, O, v0, COL.ink, 3, 'v₀', 'left');

        /* 接触点 */
        var pc = P(c, O);
        if (pc) {
          ctx.beginPath();
          ctx.arc(pc.x, pc.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = COL.ink;
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }

        /* 车体平动与自转 */
        var cv = V(s.vx * VS, s.vy * VS, 0.086);
        if (Math.abs(s.vx) > 1e-3 || Math.abs(s.vy) > 1e-3) {
          arrow(c, V(0, 0, 0.086), cv, COL.ink, 1.8, 'v', 'left');
        }
        if (Math.abs(s.w) > 1e-3) {
          var span = Math.min(4.2, Math.abs(s.w) * 1.6) * Math.sign(s.w);
          var pts = [], n = 24, r0 = 0.085;
          for (var i = 0; i <= n; i++) {
            var a0 = Math.PI * 0.5 - span * i / n;
            var pp = P(c, V(r0 * Math.cos(a0), r0 * Math.sin(a0), 0.086));
            if (pp) { pts.push(pp); }
          }
          if (pts.length === n + 1) {
            ctx.strokeStyle = COL.ink;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (i = 1; i <= n; i++) { ctx.lineTo(pts[i].x, pts[i].y); }
            ctx.stroke();
            var pe = pts[n], pp2 = pts[n - 1];
            var ang = Math.atan2(pe.y - pp2.y, pe.x - pp2.x);
            ctx.beginPath();
            ctx.moveTo(pe.x, pe.y);
            ctx.lineTo(pe.x - 9 * Math.cos(ang - 0.45), pe.y - 9 * Math.sin(ang - 0.45));
            ctx.lineTo(pe.x - 9 * Math.cos(ang + 0.45), pe.y - 9 * Math.sin(ang + 0.45));
            ctx.closePath();
            ctx.fillStyle = COL.ink;
            ctx.fill();
            text(pe.x + 8, pe.y + 4, 'ω', COL.ink, 'left', 13, 700);
          }
        }

        /* 车体系参考轴 */
        arrow(c, V(-0.16, -0.135, 0.0855), V(-0.055, -0.135, 0.0855), '#8e98a3', 1.5, '', 'left');
        var px2 = P(c, V(-0.055, -0.135, 0.0855));
        if (px2) { text(px2.x + 4, px2.y + 4, 'x 前进', COL.mute, 'left', 11, 500); }
        arrow(c, V(-0.16, -0.135, 0.0855), V(-0.16, -0.03, 0.0855), '#8e98a3', 1.5, '', 'left');
        var py2 = P(c, V(-0.16, -0.03, 0.0855));
        if (py2) { text(py2.x + 4, py2.y + 4, 'y 左', COL.mute, 'left', 11, 500); }
      }

      /* -------------------------------------------------------------- 渲染 */
      function render() {
        if (!resize()) { return false; }
        ctx.setTransform(k, 0, 0, k, 0, 0);
        ctx.clearRect(0, 0, W, H);
        var c = buildCam();
        drawGround(c);

        var list = [];
        addChassis(list, c);
        for (var i = 0; i < 4; i++) { addWheel(list, c, i); }
        list.sort(function (a, b) { return b.z - a.z; });

        for (i = 0; i < list.length; i++) {
          var it = list[i];
          if (it.t === 'p') {
            ctx.beginPath();
            ctx.moveTo(it.pts[0].x, it.pts[0].y);
            for (var j = 1; j < it.pts.length; j++) { ctx.lineTo(it.pts[j].x, it.pts[j].y); }
            ctx.closePath();
            ctx.fillStyle = it.fill;
            ctx.fill();
            ctx.strokeStyle = it.stroke;
            ctx.lineWidth = 1;
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.moveTo(it.a.x, it.a.y);
            ctx.lineTo(it.b.x, it.b.y);
            ctx.strokeStyle = it.c;
            ctx.lineWidth = it.lw;
            ctx.stroke();
          }
        }
        drawVectors(c);
      }

      /* ------------------------------------------------------------ 面板同步 */
      var tabs = $$('[data-wheel]', box);
      var inputs = $$('[data-k]', box);
      var out = box.querySelector('[data-m3d-out]');

      function sync() {
        tabs.forEach(function (b, i) { b.classList.toggle('is-on', i === s.sel); });
        inputs.forEach(function (inp) {
          var key = inp.getAttribute('data-k');
          inp.value = key === 'w' ? s.w : (key === 'vx' ? s.vx : s.vy);
          var o = inp.parentNode.querySelector('output');
          if (o) { o.textContent = fmt(parseFloat(inp.value), 2); }
        });
        if (!out) { return; }
        var st = wheelState(s.sel, s);
        var strip = WHEELS.map(function (w, i) {
          var q = wheelState(i, s).omega;
          return '<span class="' + (i === s.sel ? 'on' : '') + '">' + w.name.slice(0, 2) + ' ' + (q >= 0 ? '+' : '') + fmt(q, 1) + '</span>';
        }).join('');
        out.innerHTML =
          '<div class="m3d-head">' + st.w.name + '<em>r = (' + fmt(st.rx) + ', ' + fmt(st.ry) + ') m</em></div>' +
          '<div class="m3d-line"><span>v₀ = (v<sub>x</sub> − ωb, v<sub>y</sub> + ωa)</span><b>(' + fmt(st.v0x) + ', ' + fmt(st.v0y) + ')</b></div>' +
          '<div class="m3d-line dim"><span>u = (' + fmt(st.ux) + ', ' + fmt(st.uy) + ')　g = (' + fmt(st.gx) + ', ' + fmt(st.gy) + ')</span></div>' +
          '<div class="m3d-line hot"><span>v∥ = v₀·u　驱动 → 轮毂</span><b>' + fmt(st.vp) + ' m/s</b></div>' +
          '<div class="m3d-line"><span>v⊥ = v₀·g　自由 → 辊子</span><b>' + fmt(st.vg) + ' m/s</b></div>' +
          '<div class="m3d-line hot"><span>ω<sub>轮毂</sub> = √2·v∥ / r</span><b>' + (st.omega >= 0 ? '+' : '') + fmt(st.omega, 1) + ' rad/s</b></div>' +
          '<div class="m3d-fx">通式　ω = ' + st.w.fx + '</div>' +
          '<div class="m3d-strip">' + strip + '</div>';
      }

      /* -------------------------------------------------------------- 交互 */
      var drag = null;

      function pointer(e) {
        var rect = canvas.getBoundingClientRect();
        return {
          x: (e.clientX - rect.left) * (canvas.clientWidth / rect.width),
          y: (e.clientY - rect.top) * (canvas.clientHeight / rect.height)
        };
      }

      canvas.addEventListener('pointerdown', function (e) {
        drag = { x: e.clientX, y: e.clientY, yaw: s.yaw, pitch: s.pitch, moved: 0 };
        canvas.classList.add('is-drag');
        if (canvas.setPointerCapture) { canvas.setPointerCapture(e.pointerId); }
        e.stopPropagation();
      });

      canvas.addEventListener('pointermove', function (e) {
        if (!drag) { return; }
        var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
        s.yaw = drag.yaw - dx * 0.0085;
        s.pitch = Math.max(0.05, Math.min(1.35, drag.pitch + dy * 0.006));
        paint();
        e.stopPropagation();
      });

      canvas.addEventListener('pointerup', function (e) {
        canvas.classList.remove('is-drag');
        if (drag && drag.moved < 6) {
          var pt = pointer(e), c = buildCam(), best = -1, bestD = 1e9;
          for (var i = 0; i < 4; i++) {
            var p = P(c, V(WHEELS[i].sx * LA, WHEELS[i].sy * LB, RW));
            if (!p) { continue; }
            var d = Math.sqrt((p.x - pt.x) * (p.x - pt.x) + (p.y - pt.y) * (p.y - pt.y));
            if (d < bestD) { bestD = d; best = i; }
          }
          if (best >= 0 && bestD < Math.max(36, W * 0.07)) {
            s.sel = best;
            sync();
            paint();
          }
        }
        drag = null;
        e.stopPropagation();
      });

      canvas.addEventListener('wheel', function (e) {
        e.preventDefault();
        e.stopPropagation();
        s.zoom = Math.max(0.62, Math.min(3.2, s.zoom * (e.deltaY > 0 ? 1.09 : 0.92)));
        paint();
      }, { passive: false });

      ['touchstart', 'touchmove', 'touchend'].forEach(function (t) {
        canvas.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true });
      });

      tabs.forEach(function (btn, i) {
        btn.addEventListener('click', function () { s.sel = i; sync(); paint(); });
      });

      inputs.forEach(function (inp) {
        inp.addEventListener('input', function () {
          var key = inp.getAttribute('data-k');
          var v = parseFloat(inp.value);
          if (key === 'vx') { s.vx = v; } else if (key === 'vy') { s.vy = v; } else { s.w = v; }
          sync();
          paint();
        });
      });

      $$('[data-preset]', box).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var p = btn.getAttribute('data-preset');
          if (p === 'fwd') { s.vx = 1; s.vy = 0; s.w = 0; }
          if (p === 'strafe') { s.vx = 0; s.vy = 1; s.w = 0; }
          if (p === 'spin') { s.vx = 0; s.vy = 0; s.w = 1.5; }
          if (p === 'diag') { s.vx = 0.8; s.vy = 0.8; s.w = 0; }
          sync();
          paint();
        });
      });

      $$('[data-view]', box).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var v = btn.getAttribute('data-view');
          if (v === 'iso') { s.yaw = 0.96; s.pitch = 0.58; s.zoom = 1.42; }
          if (v === 'top') { s.yaw = Math.PI; s.pitch = 1.52; s.zoom = 1.2; }
          if (v === 'front') { s.yaw = 0.06; s.pitch = 0.16; s.zoom = 1.45; }
          paint();
        });
      });

      window.addEventListener('resize', function () { setTimeout(paint, 60); });

      function paint() {
        if (render()) { need = false; }
      }
      if (window.Reveal && window.Reveal.on) {
        window.Reveal.on('slidechanged', function () { setTimeout(paint, 80); });
        window.Reveal.on('resize', function () { setTimeout(paint, 80); });
      }
      setTimeout(paint, 120);

      /* -------------------------------------------------------------- 循环 */
      function frame() {
        var t = (window.performance && window.performance.now) ? window.performance.now() : Date.now();
        var dt = last ? Math.min(0.06, (t - last) / 1000) : 0;
        last = t;
        /* 不在当前页时省电：定期检查即可 */
        if (canvas.offsetParent === null) { last = 0; return; }
        if (s.live) {
          var spinning = false;
          for (var i = 0; i < 4; i++) {
            var wq = wheelState(i, s);
            if (Math.abs(wq.omega) > 0.05 || Math.abs(wq.v0y) > 0.05) {
              /* 轮毂转多少由 v∥ 决定；辊子转多少由接触点沿轴向的滑移 v0y 决定 */
              s.spin[i] += wq.omega * dt * SPIN;
              s.slip[i] -= wq.v0y * dt * SPIN;
              spinning = true;
            }
          }
          if (spinning) { need = true; }
        }
        if (need) {
          need = false;
          render();
        }
      }

      sync();
      window.setInterval(frame, 33);

      /* 供课件脚本/演示与自动化检查用：拿到状态与轮心在画布上的位置 */
      canvas.__m3d = {
        state: s,
        wheelAt: function (i) {
          var w = WHEELS[i];
          return P(buildCam(), V(w.sx * LA, w.sy * LB, RW));
        }
      };
    }

    return function (root) {
      $$('[data-m3d]', root || document).forEach(attach);
    };
  })();

  window.Lecture9 = {
    initAll: function (root) {
      initFlow(root || document);
      initCar(root || document);
      initM3D(root || document);
    }
  };
})();
