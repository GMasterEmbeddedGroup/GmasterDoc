(function () {
  'use strict';
  var notes = {
    '06-digital-levels.html': '数字电路把连续电压划分成逻辑状态。VIL(max) 与 VIH(min) 之间是未保证区域，不应把阈值简单理解为电源电压的一半。',
    '05-what-is-gpio.html': 'GPIO 是芯片与外部世界之间最基础的数字接口。输入时外部电路决定电平；输出时 MCU 决定电平；复用时控制权交给片上外设。',
    '10-board-schematic.html': '阅读原理图时沿电流路径追踪：从 3.3 V 出发，经过 LED 和 510 Ω 电阻到 PC13。这样能直接判断 LED 为低电平有效。',
    '11-pc13-led.html': '“低电平有效”只描述电路极性，不代表程序逻辑必须反着写。把极性封装到 Led_Set() 后，上层仍可使用 on=true 表达点亮。',
    '12-button-circuits.html': '上拉和下拉的作用是给“无人驱动”的输入提供默认电平。按键闭合后形成更低阻抗路径，覆盖这个较弱的默认状态。',
    '13-pull-floating.html': '浮空不是稳定的第三种逻辑状态，而是没有确定电位。示波器、手指或导线本身都可能改变它，所以浮空问题不能靠延时解决。',
    '14-debounce.html': '抖动来自机械触点的弹跳，不是程序执行过快。消抖的核心是要求新状态持续一段时间，而不是在中断里简单阻塞等待。',
    '08-pin-structure.html': '焊盘是芯片和外部电路真正连接的金属节点。模式配置会开关焊盘后的不同内部通路，但不会改变外部接线。',
    '09-five-volt.html': '“5 V 容忍”通常针对数字输入条件；它不是输出能力，也不是所有工作模式都成立。设计时要同时核对引脚表脚注和电气特性。',
    '07-electrical-limits.html': '绝对最大额定值用于判断损坏边界，正常设计应满足推荐工作条件和输出电平指标，并给温度、批次及瞬态留出裕量。',
    '16-eight-modes.html': '八种模式并非八套互不相关的功能，而是输入路径、输出晶体管结构和控制来源的组合。先判断信号方向，再选择电气结构。',
    '17-analog-input.html': '模拟模式关闭数字输入缓冲器，避免其在中间电压附近反复翻转并消耗额外电流。ADC 随后把连续电压转换为数值。',
    '18-floating-input.html': '只有当外部器件在任何时刻都能明确驱动高或低时，浮空输入才可靠。插拔、复位或外设未上电期间也要纳入判断。',
    '19-pull-input.html': 'STM32F1 的上下拉方向由 ODR 对应位选择，这是 F1 特有的重要细节。HAL 会完成这一组合，但读寄存器时仍应知道原因。',
    '20-push-pull.html': '推挽级包含上拉与下拉晶体管，可主动输出高低电平。两个推挽输出若输出相反状态会发生争用，因此不能直接并联。',
    '21-open-drain.html': '开漏只能主动拉低；写 1 表示释放线路。外部上拉把线路恢复为高电平，因此多个器件可以安全共享一条线。',
    '22-alternate-function.html': '复用功能改变的是“谁控制输出”：从 GPIO 的 ODR 改为 USART、SPI 或定时器。推挽/开漏和速度仍由 GPIO 配置决定。',
    '23-output-speed.html': '速度字段主要改变输出驱动强度和边沿快慢。低速信号选过高速度会增加电磁干扰，却不会提高代码循环频率。',
    '26-port-clock.html': '外设时钟像模块的总开关。未使能时，CPU 即使访问配置寄存器，外设也不会按预期工作；这是“代码运行但引脚不动”的常见原因。',
    '27-crl-crh.html': '每个引脚占连续 4 位。掩码先清除目标字段，再写入新值；直接赋整个寄存器会破坏同一端口其他引脚的配置。',
    '28-config-table.html': '查表时先看 MODE：00 表示输入，其余值表示输出及速度；再看 CNF，决定浮空、上下拉、推挽、开漏或复用。',
    '29-idr-odr.html': 'IDR 反映焊盘此刻实际电平，ODR 是输出锁存器希望输出的值。受外部短路或重负载影响时，两者可能不一致。',
    '30-bsrr-brr.html': 'BSRR 只需一次写入即可置位或复位多个目标位，不会经历“读取—修改—写回”的竞争窗口，因此比修改 ODR 更适合并发代码。',
    '32-afio-remap.html': 'AFIO 是 Alternate Function I/O。它负责外设引脚重映射和 EXTI 端口选择；使用前同样需要打开 AFIO 时钟。',
    '33-register-led.html': '初始化顺序有意先写安全输出值，再切换为输出模式。这样能缩短引脚处于错误电平的瞬间，驱动使能类信号尤其需要注意。',
    '34-register-button.html': '输入读取使用按位与判断目标位。不要把整个 IDR 与 1 直接比较，因为端口内其他引脚也可能为高电平。',
    '36-cubemx-steps.html': 'CubeMX 负责把选择转换为初始化代码，但不会检查板外电路是否接对。生成后仍需对照原理图和 MX_GPIO_Init()。',
    '37-generated-init.html': '阅读生成代码不要逐行死记：先找时钟，再找安全初值，最后看结构体和 HAL_GPIO_Init() 的端口参数。',
    '38-hal-init-fields.html': 'Pin 是位掩码而不是引脚序号。例如 GPIO_PIN_13 的数值只有第 13 位为 1，因此同一配置可用按位或组合多个引脚。',
    '39-hal-io-api.html': 'ReadPin 返回输入状态，WritePin 写确定状态，TogglePin 翻转当前锁存值。涉及安全输出时，明确写 SET/RESET 通常比翻转更容易推理。',
    '40-active-low-api.html': '驱动层把原理图中的电平极性转换为业务语义。板级电路改变时，只需修改这一层，应用代码无需到处取反。',
    '41-exti-path.html': 'EXTI 负责检测边沿，NVIC 负责中断优先级和 CPU 分发。两者缺一不可；GPIO 模式正确也不代表中断链路已经完整。',
    '42-exti-config.html': 'IRQ 是 Interrupt Request。配置 EXTI 模式后，还要设置 NVIC 优先级并使能对应 IRQ，启动文件中的处理函数才能被调用。',
    '43-callback-debounce.html': '中断回调应尽快结束：记录时间或置位标志，把耗时处理留给主循环。这样不会长期阻塞其他中断和系统节拍。',
    '44-common-errors.html': '排错时一次只验证一层：先确认供电与共地，再测物理脚，随后核对模式与时钟，最后才检查业务逻辑。',
    '45-measurement.html': '调试器看到的是 CPU 变量，仪器看到的是真实焊盘。两者一起使用，才能区分“程序没有写”与“写了但电路没响应”。',
    '46-driving-loads.html': 'GPIO 适合逻辑控制，不是功率电源。驱动感性负载时，功率器件承担电流，续流二极管为关断瞬间的电流提供安全路径。'
  };

  function enrich(root, files) {
    var sections = Array.prototype.slice.call(root.querySelectorAll(':scope > section'));
    sections.forEach(function (section, index) {
      var value = notes[files[index]];
      if (!value || section.querySelector('.study-note')) { return; }
      var box = document.createElement('div');
      box.className = 'study-note';
      box.innerHTML = '<b>进一步理解</b>' + value;
      section.appendChild(box);
    });
  }

  window.Lecture6Study = { enrich: enrich };
})();
