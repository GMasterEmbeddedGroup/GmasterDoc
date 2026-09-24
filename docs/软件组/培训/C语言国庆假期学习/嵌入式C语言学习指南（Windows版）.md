# 嵌入式 C 语言学习指南（Windows 版）

<p><span style="color:#2ea121">To be a programmer, not just a coder</span></p>

## 1. 课程设计思想

<p>从&quot;三个&quot;视角出发，掌握C语言设计的底层逻辑。</p>

![原文图解（第 3 页）](assets/figures/p003-00.png)

<p>1.「内存（硬件）视角」：操作底层最适合的语言</p>

<p>C语言最核心的、最powerful的能力：操作内存资源。实际上CPU外设硬件（GPIO、I2C、UART等等）本质上是内存映射。所以，C语言控制硬件本质上是操作内存，学会用内存的角度看待C语言，实际工程中面对问题才会得心应手。</p>

![原文图解（第 3 页）](assets/figures/p003-05.png)

![原文图解（第 4 页）](assets/figures/p004-00.png)

<p><span style="color:#646a73">stm32</span><span style="color:#646a73">外</span><span style="color:#646a73">设</span><span style="color:#646a73">内</span><span style="color:#646a73">存</span><span style="color:#646a73">映</span><span style="color:#646a73">射</span></p>

<p>2.「函数（架构）视角」：程序逻辑、架构设计</p>

<p>面向过程的语言怎么做架构设计？能否借助C++/JAVA面向对象思想，写出优秀的代码？</p>

<p><span style="color:#1456f0">a.</span> C语言中的 ”重载“、”继承“、”多态“、”封装“思想</p>

<p><span style="color:#1456f0">b.</span> C语言程序设计怎么做到满足&quot;solid&quot;原则</p>

<p><span style="color:#1456f0">c.</span> 内核中常见的设计模式有哪些？</p>

![原文图解（第 5 页）](assets/figures/p005-00.png)

<p>3.「编译器视角」</p>

<p>在工程中经常会讨论到，这个xx问题可能是编译器带来的。如，volatile防止O3编译优化导致的内存miss问题、 宏函数展开没有语法检查，怎么用才安全？</p>

<pre class="guide-code"><code><span style="color:#646a73">#stm32f103xb.h</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2">     __O     volatile             </span><span style="color:#a0a1a7">/*!&lt; Defines &#x27;write only&#x27; permissions </span>
<span style="color:#a0a1a7">*/</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2">     __IO    volatile             </span><span style="color:#a0a1a7">/*!&lt; Defines &#x27;read / write&#x27; </span>
<span style="color:#a0a1a7">permissions */</span>

<span style="color:#a626a4">typedef</span> <span style="color:#a626a4">struct</span>
{
  __IO <span style="color:#986801">uint32_t</span> CRL;
  __IO <span style="color:#986801">uint32_t</span> CRH;
  __IO <span style="color:#986801">uint32_t</span> IDR;
  __IO <span style="color:#986801">uint32_t</span> ODR;
  __IO <span style="color:#986801">uint32_t</span> BSRR;
  __IO <span style="color:#986801">uint32_t</span> BRR;
  __IO <span style="color:#986801">uint32_t</span> LCKR;
} GPIO_TypeDef;</code></pre>

<p>利用编译器特性做代码设计：__attribute__((packed))、__attribute__((&quot;section&quot;))  等等。官网(<span style="color:#336df4">https://gcc.gnu.org/onlinedocs/gcc/Common-Function-Attributes.html</span>)</p>

<pre class="guide-code"><code><span style="color:#646a73">#cmsis_gcc.h</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> __NO_RETURN                __attribute__((__noreturn__))</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> __USED                     __attribute__((used))</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> __WEAK                     __attribute__((weak))</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> __PACKED                   __attribute__((packed, aligned(1)))</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> __PACKED_STRUCT            struct __attribute__((packed, aligned(1)))</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> __PACKED_UNION             union __attribute__((packed, aligned(1)))</span></code></pre>

<pre class="guide-code"><code><span style="color:#646a73">#include/linux/init.h</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">ifndef</span><span style="color:#4078f2"> MODULE</span>
<span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">省</span><span style="color:#a0a1a7">略</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> module_init(x)  __initcall(x);</span>
<span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">省</span><span style="color:#a0a1a7">略</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">else</span>

<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> module_init(x)  __initcall(x);</span>
|
--&gt; <span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> __initcall(fn) device_initcall(fn)</span>
    |
    --&gt; <span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> device_initcall(fn)     __define_initcall(fn, 6)</span>
        |
        --&gt; <span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> __define_initcall(fn, id) \</span>
<span style="color:#4078f2">                static initcall_t __initcall_##fn##id __used \</span>
<span style="color:#4078f2">                __attribute__((__section__(</span><span style="color:#50a14f">&quot;.initcall&quot;</span><span style="color:#4078f2"> #id </span><span style="color:#50a14f">&quot;.init&quot;</span><span style="color:#4078f2">))) = fn</span></code></pre>

## 2. 编译器视角

### 2.1 预处理

<p>预处理在工程上有很多的用处，特别是在代码管理、调试上有很多编程技巧可以用。</p>

#### 2.1.1 条件编译

<p>1、调试版本和release版本（调试信息的脱敏、性能的影响：code大小、运行效率）</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#986801">int</span> password = <span style="color:#986801">0x37847110</span>；
<span style="color:#986801">int</span> <span style="color:#c18401">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;debug log</span><span style="color:#50a14f">：</span><span style="color:#50a14f">password is %x\n&quot;</span>，password)；
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>；
}</code></pre>

<p>问：以上打印的debug log，怎么样在不修改代码的情况下去掉？</p>

<p>代码可以改造成这样：</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> password = <span style="color:#986801">0x37847110</span>;
<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
<span style="color:#4078f2">#</span><span style="color:#a626a4">ifdef</span><span style="color:#4078f2"> DEBUG</span>
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;debug log</span><span style="color:#50a14f">：</span><span style="color:#50a14f">password is %x\n&quot;</span>, password);
<span style="color:#4078f2">#</span><span style="color:#a626a4">else</span>
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;release version \n&quot;</span>);
<span style="color:#4078f2">#</span><span style="color:#a626a4">endif</span>
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}</code></pre>

<p>编译时用gcc -D xx选项定义宏</p>

<pre class="guide-code"><code>gcc -o bin <span style="color:#986801">1.</span>c -D DEBUG
./bin
<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
log：password is <span style="color:#986801">37847110</span></code></pre>

<p>2、feature的配置（linux里面大量的feature宏设计）</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#4078f2">#</span><span style="color:#a626a4">ifdef</span><span style="color:#4078f2"> TOUCH_PANEL_DERIVER</span>
<span style="color:#986801">void</span> <span style="color:#4078f2">tp_driver</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;tp init \n&quot;</span>);
}
<span style="color:#4078f2">#</span><span style="color:#a626a4">endif</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
<span style="color:#4078f2">#</span><span style="color:#a626a4">ifdef</span><span style="color:#4078f2"> TOUCH_PANEL_DERIVER</span>
    <span style="color:#c18401">tp_driver</span>();
<span style="color:#4078f2">#</span><span style="color:#a626a4">endif</span>
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;main end\n&quot;</span>);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}</code></pre>

<pre class="guide-code"><code>gcc -o bin <span style="color:#986801">1.</span>c -D TOUCH_PANEL_DERIVER
./bin
<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
tp init
main end</code></pre>

<p>3、通过#warning、#error进行配置提示</p>

<p>如上面这个例子，如果想让程序员实现touch panel的驱动，可以在预编译的时候直接提示或者直接报错。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#4078f2">#</span><span style="color:#a626a4">ifndef</span><span style="color:#4078f2"> TOUCH_PANEL_DERIVER</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">warning</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&quot;You should complement TP driver&quot;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">endif</span>

<span style="color:#4078f2">#</span><span style="color:#a626a4">ifdef</span><span style="color:#4078f2"> TOUCH_PANEL_DERIVER</span>
<span style="color:#986801">void</span> <span style="color:#4078f2">tp_driver</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;tp init \n&quot;</span>);
}
<span style="color:#4078f2">#</span><span style="color:#a626a4">endif</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
<span style="color:#4078f2">#</span><span style="color:#a626a4">ifdef</span><span style="color:#4078f2"> TOUCH_PANEL_DERIVER</span>
    <span style="color:#c18401">tp_driver</span>();
<span style="color:#4078f2">#</span><span style="color:#a626a4">endif</span>
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;main end\n&quot;</span>);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}</code></pre>

<pre class="guide-code"><code>gcc -o bin <span style="color:#986801">1.</span>c
./bin
<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
cc -o bin <span style="color:#986801">1.</span>c
<span style="color:#986801">1.</span>c:<span style="color:#986801">4</span>:<span style="color:#986801">2</span>: warning: <span style="color:#4078f2">#</span><span style="color:#a626a4">warning</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&quot;You should complement TP driver&quot;</span><span style="color:#4078f2"> [-Wcpp]</span>
    <span style="color:#986801">4</span> | <span style="color:#4078f2">#</span><span style="color:#a626a4">warning</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&quot;You should complement TP driver&quot;</span>
      |  ^~~~~~~</code></pre>

#### 2.1.2 宏定义使用

<p>宏展开过程时纯粹文本替换，不进行语法检查。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> </span><span style="color:#4078f2">宏</span><span style="color:#4078f2">名</span><span style="color:#4078f2"> </span><span style="color:#4078f2">宏</span><span style="color:#4078f2">体</span>
<span style="color:#646a73">#</span><span style="color:#646a73">建</span><span style="color:#646a73">议</span><span style="color:#646a73">1:</span><span style="color:#646a73">定</span><span style="color:#646a73">义</span><span style="color:#646a73">宏</span><span style="color:#646a73">体</span><span style="color:#646a73">用</span><span style="color:#646a73">()</span><span style="color:#646a73">包</span><span style="color:#646a73">起</span><span style="color:#646a73">来</span><span style="color:#646a73">，</span><span style="color:#646a73">不</span><span style="color:#646a73">要</span><span style="color:#646a73">吝</span><span style="color:#646a73">啬</span><span style="color:#646a73">（）</span>
<span style="color:#646a73">#</span><span style="color:#646a73">建</span><span style="color:#646a73">议</span><span style="color:#646a73">2:</span><span style="color:#646a73">宏</span><span style="color:#646a73">名</span><span style="color:#646a73">一</span><span style="color:#646a73">般</span><span style="color:#646a73">都</span><span style="color:#646a73">是</span><span style="color:#646a73">大</span><span style="color:#646a73">写</span><span style="color:#646a73">字</span><span style="color:#646a73">母</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> ABC (123)</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> SECEND_OF_YEAR  (365*24*60*60)UL</span>

<span style="color:#646a73">#</span><span style="color:#646a73">多</span><span style="color:#646a73">行</span><span style="color:#646a73">可</span><span style="color:#646a73">以</span><span style="color:#646a73">用</span><span style="color:#646a73">“\”</span><span style="color:#646a73">进</span><span style="color:#646a73">行</span><span style="color:#646a73">换</span><span style="color:#646a73">行</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> IIC_SDA(status)                             \</span>
<span style="color:#4078f2">    do {                                            \</span>
<span style="color:#4078f2">        GPIO_InitTypeDef GPIO_InitStruct = {        \</span>
<span style="color:#4078f2">            .Pin = _SDA,                            \</span>
<span style="color:#4078f2">            .Mode = GPIO_MODE_OUTPUT_PP,            \</span>
<span style="color:#4078f2">            .Pull = GPIO_NOPULL,                    \</span>
<span style="color:#4078f2">            .Speed = GPIO_SPEED_FREQ_HIGH,          \</span>
<span style="color:#4078f2">        };                                          \</span>
<span style="color:#4078f2">        HAL_GPIO_Init(_SDA_PORT, &amp;GPIO_InitStruct); \</span>
<span style="color:#4078f2">        HAL_GPIO_WritePin(_SDA_PORT, _SDA, status); \</span>
<span style="color:#4078f2">    } while (0)</span>

Q: 在Linux内核中有许多使用<span style="color:#a626a4">do</span>{...}<span style="color:#a626a4">while</span>(<span style="color:#986801">0</span>)的宏定义。这种宏的用途是什么？有什么好处？
A: <span style="color:#a626a4">do</span> {...} <span style="color:#a626a4">while</span>(<span style="color:#986801">0</span>)在C中是唯一的构造程序，让你定义的宏总是以你希望的方向工作，这样不管
怎么使用宏。感受一下这个例子：

<span style="color:#986801">1</span>、
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> FUNC(a, b) a++; b++</span>

<span style="color:#a626a4">if</span> (xx)
    <span style="color:#c18401">FUNC</span>(a，b);

<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">展</span><span style="color:#a0a1a7">开</span><span style="color:#a0a1a7">后</span><span style="color:#a0a1a7">语</span><span style="color:#a0a1a7">法</span><span style="color:#a0a1a7">错</span><span style="color:#a0a1a7">误</span>
<span style="color:#a626a4">if</span> (xx)
    a++;
    b++;

<span style="color:#986801">2</span>、
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> FUNC(a, b) {a++; b++}</span>

<span style="color:#a626a4">if</span> (xx)
    <span style="color:#c18401">FUNC</span>(a，b);
<span style="color:#a626a4">else</span>
    xx

<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">展</span><span style="color:#a0a1a7">开</span><span style="color:#a0a1a7">后</span><span style="color:#a0a1a7">语</span><span style="color:#a0a1a7">法</span><span style="color:#a0a1a7">错</span><span style="color:#a0a1a7">误</span>
<span style="color:#a626a4">if</span> (xx) {
    a++;
    b++;
}；
<span style="color:#a626a4">else</span>
    xx

<span style="color:#986801">3</span>、
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> FUNC(a, b) do {a++; b++} while(0)</span>
<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">展</span><span style="color:#a0a1a7">开</span><span style="color:#a0a1a7">后</span><span style="color:#a0a1a7">语</span><span style="color:#a0a1a7">法</span><span style="color:#a0a1a7">错</span><span style="color:#a0a1a7">误</span>
<span style="color:#a626a4">if</span> (xx)
    <span style="color:#a626a4">do</span> {
        a++;
        b++;
    } <span style="color:#a626a4">while</span>(<span style="color:#986801">0</span>)；
<span style="color:#a626a4">else</span>
    xx</code></pre>

<pre class="guide-code"><code>Q：下面代码运行是否符合预期？
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> ABC 10+2</span>

<span style="color:#986801">void</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> a = ABC * <span style="color:#986801">10</span>;
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a = %d \n&quot;</span>, a);
}

A: 会有问题，宏展开后是<span style="color:#986801">10</span>+<span style="color:#986801">2</span>*<span style="color:#986801">10</span>，不符合预期</code></pre>

<pre class="guide-code"><code>Q：下面代码编译完后，在运行时是否有乘法计算？

<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> SECEND_OF_YEAR  (365*24*60*60)UL</span>
<span style="color:#986801">void</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> a = SECEND_OF_YEAR;

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a = %d \n&quot;</span>, a);
}

A: 没有，编译器已经完成的计算</code></pre>

#### 2.1.3 宏函数

##### 2.1.3.1 宏函数的定义

<p>宏函数本质不是函数。展开规则依旧是纯粹文本替换，不会检测语法错误。正因如此，宏函数直接插入调用的地方，少了函数调用的消耗（出栈入栈等操作），所以是典型的用空间换性能的做法。同样的，为了宏展开不会出错建议：整体和变量都加上()</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> </span><span style="color:#4078f2">宏</span><span style="color:#4078f2">名</span><span style="color:#4078f2">(x) (x)</span>

<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> ADD(a, b) ((a)+(b))</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> RAD2DEG</span><span style="color:#4078f2">（</span><span style="color:#4078f2">x</span><span style="color:#4078f2">）</span><span style="color:#4078f2"> </span><span style="color:#4078f2">（</span><span style="color:#4078f2">(x)*57.295f</span><span style="color:#4078f2">）</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> F2C</span><span style="color:#4078f2">（</span><span style="color:#4078f2">x</span><span style="color:#4078f2">）</span><span style="color:#4078f2"> (((x)-32)*5/9)</span></code></pre>

<pre class="guide-code"><code>Q：比较两个数大小的代码运行是否符合预期？
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> MAX(a, b) ((a)&gt;(b)?(a):(b))</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> a = <span style="color:#986801">2</span>;
    <span style="color:#986801">int</span> b = <span style="color:#986801">3</span>;

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a = %d, b = %d, the bigger value = %d \n&quot;</span>,
            a, b, <span style="color:#c18401">MAX</span>(a++, b++));
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}
期望：a = <span style="color:#986801">3</span>, b = <span style="color:#986801">2</span>, the bigger value = <span style="color:#986801">3</span>

A:</code></pre>

<pre class="guide-code"><code><span style="color:#646a73">#</span><span style="color:#646a73">参</span><span style="color:#646a73">考</span><span style="color:#646a73">linux</span><span style="color:#646a73">下</span><span style="color:#646a73">MAX</span><span style="color:#646a73">的</span><span style="color:#646a73">实</span><span style="color:#646a73">现</span><span style="color:#646a73">(3.18</span><span style="color:#646a73">内</span><span style="color:#646a73">核</span><span style="color:#646a73">)</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> MAX(x, y) ({                      \</span>
<span style="color:#4078f2">        typeof(x) _max1 = (x);            \</span>
<span style="color:#4078f2">        typeof(y) _max2 = (y);            \</span>
<span style="color:#4078f2">        (void) (&amp;_max1 == &amp;_max2);        \</span>
<span style="color:#4078f2">        _max1 &gt; _max2 ? _max1 : _max2; })</span></code></pre>

##### 2.1.3.2 '#' 字符串化

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> LOG_INFO(x) printf(</span><span style="color:#50a14f">&quot;%s is %d \n&quot;</span><span style="color:#4078f2">, #x, (x))</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> a = <span style="color:#986801">2</span>;

    <span style="color:#c18401">LOG_INFO</span>(a);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span><span style="color:#646a73">&amp;</span>
a is <span style="color:#986801">2</span></code></pre>

##### 2.1.3.3 '##' 连接符号

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> DAY_DELARE(x) int day##x</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> DAY(x) day##x</span>

<span style="color:#c18401">DAY_DELARE</span>(<span style="color:#986801">1</span>);
<span style="color:#c18401">DAY_DELARE</span>(<span style="color:#986801">2</span>);
<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">DAY</span>(<span style="color:#986801">1</span>) = <span style="color:#986801">10</span>;
    <span style="color:#c18401">DAY</span>(<span style="color:#986801">2</span>) = <span style="color:#986801">20</span>;

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;day1:%d day2:%d \n&quot;</span>, <span style="color:#c18401">DAY</span>(<span style="color:#986801">1</span>), <span style="color:#c18401">DAY</span>(<span style="color:#986801">2</span>));
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
day1:<span style="color:#986801">10</span> day2:<span style="color:#986801">20</span></code></pre>

#### 2.1.4 系统预定义的宏

<p>__FUNCTION__：函数名</p>

<p>__LINE__：调用所在行数</p>

<p>__FILE__: 函数所在文件名</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> LOG_INFO(x) printf(</span><span style="color:#50a14f">&quot;%s %s:line:%d</span><span style="color:#50a14f">：</span><span style="color:#50a14f">%d \n&quot;</span><span style="color:#4078f2">,\</span>
<span style="color:#4078f2">                    __FILE__,\</span>
<span style="color:#4078f2">                    __FUNCTION__,\</span>
<span style="color:#4078f2">                    __LINE__,\</span>
<span style="color:#4078f2">                    (x))</span>
<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> a = <span style="color:#986801">10</span>;

    <span style="color:#c18401">LOG_INFO</span>(a);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
<span style="color:#986801">1.</span>c main:line:<span style="color:#986801">12</span>：<span style="color:#986801">10</span></code></pre>

#### 2.1.5 常用的log宏

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> TAG </span><span style="color:#50a14f">&quot;ABC&quot;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> LOG_INFO(format,...) printf(</span><span style="color:#50a14f">&quot;[%s][%s:%d]: &quot;</span><span style="color:#4078f2">format</span><span style="color:#50a14f">&quot;&quot;</span><span style="color:#4078f2">, TAG, __func__ , </span>
<span style="color:#4078f2">__LINE__, ##__VA_ARGS__)</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> a = <span style="color:#986801">10</span>;

    <span style="color:#c18401">LOG_INFO</span>(<span style="color:#50a14f">&quot;a = %d \n&quot;</span>,a);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
[ABC][main:<span style="color:#986801">10</span>]: a = <span style="color:#986801">10</span></code></pre>

### 2.2 关键字（32个）

<p>编译器翻译代码的过程是逐行字符解析，所以C语言标准里面预定义了32个有特定意义的&quot;字符串&quot;，当编译器读到这些字符串就知道程序员想表达的意思。关键字大体上可以分成3大类：数据类型关键字、修饰关键字、逻辑关键字。</p>

#### 2.2.1 sizeof关键字

<p>sizeof（x）: 编译器给我们查看内存空间容量的一个工具，在<span style="color:#d83931">编</span><span style="color:#d83931">译</span><span style="color:#d83931">时</span>计算并确定出x在内存中所占字节数。</p>

##### 2.2.1.1 sizeof(常量/变量/数据类型)

<p>sizeof传入参数可以是常量、变量、数据类型。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> a = <span style="color:#986801">10</span>;

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;size of 10 is: %ld \n&quot;</span>, <span style="color:#c18401">sizeof</span>(<span style="color:#986801">10</span>));
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;size of a is: %ld \n&quot;</span>, <span style="color:#c18401">sizeof</span>(a));
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;size of int is: %ld \n&quot;</span>, <span style="color:#c18401">sizeof</span>(<span style="color:#986801">int</span>));

    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
size of <span style="color:#986801">10</span> is: <span style="color:#986801">4</span>
size of a is: <span style="color:#986801">4</span>
size of <span style="color:#986801">int</span> is: <span style="color:#986801">4</span></code></pre>

##### 2.2.1.2 sizeof(函数)

<p>sizeof传入函数时，得到的结果是计算出函数「返回值」的内存空间大小，函数本身不会被调用（侧面也反应sizeof是在编译时就计算出空间大小，而不是在运行时）。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">func</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;func call \n&quot;</span>);<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">这</span><span style="color:#a0a1a7">句</span><span style="color:#a0a1a7">log</span><span style="color:#a0a1a7">不</span><span style="color:#a0a1a7">会</span><span style="color:#a0a1a7">被</span><span style="color:#a0a1a7">打</span><span style="color:#a0a1a7">印</span>
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> a = <span style="color:#986801">10</span>;

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;size of func is: %ld \n&quot;</span>, <span style="color:#c18401">sizeof</span>(<span style="color:#c18401">func</span>()));
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
size of func is: <span style="color:#986801">4</span></code></pre>

##### 2.2.1.3 常被误解成函数

<p>1、sizeof使用时不一定要有（），但函数调用一定要有（）。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> a = <span style="color:#986801">10</span>;

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;size of a is: %ld&quot;</span>, <span style="color:#a626a4">sizeof</span> a);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}；

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
size of a is: <span style="color:#986801">4</span></code></pre>

<p>2、翻译成汇编就很清晰看到，sizeof在编译的时候就直接算出内存空间大小，并没有函数的入栈出栈、call 操作。可以体会一下 my_sizeof 和 sizeof 在汇编层面上的区别：</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> a = <span style="color:#986801">10</span>;
<span style="color:#986801">int</span> b = <span style="color:#986801">0</span>;
<span style="color:#986801">int</span> c = <span style="color:#986801">0</span>;

<span style="color:#986801">int</span> <span style="color:#4078f2">my_sizeof</span>(<span style="color:#986801">int</span> a)
{
    <span style="color:#a626a4">return</span> <span style="color:#c18401">sizeof</span>(a);
}

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    b = <span style="color:#c18401">sizeof</span>(a);
    c = <span style="color:#c18401">my_sizeof</span>(a);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}</code></pre>

<pre class="guide-code"><code>main:
.LFB1:
    ...
    //b = sizeof(a);
    <span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">编</span><span style="color:#a0a1a7">译</span><span style="color:#a0a1a7">时</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">就</span><span style="color:#a0a1a7">计</span><span style="color:#a0a1a7">算</span><span style="color:#a0a1a7">出</span><span style="color:#a0a1a7">来</span><span style="color:#a0a1a7"> b = 4</span>
    <span style="color:#de7802">movl    $4, b(%rip)</span>

    //c = my_sizeof(a);
<span style="color:#245bdb">    movl    a(%rip), %eax</span>
<span style="color:#245bdb">    movl    %eax, %edi</span>
<span style="color:#245bdb">    </span><span style="color:#d83931">call    my_sizeof</span>
<span style="color:#245bdb">    movl    %eax, c(%rip)</span>
    ...</code></pre>

#### 2.2.2 数据类型关键字

<p>我们知道C语言最终是为操作内存资源服务的。那操作内存必然要回答一个问题：如何来圈定一个要操作内存的大小？继续往下看：</p>

![原文图解（第 41 页）](assets/figures/p041-21.png)

##### 2.2.2.1 标准类型

<p>C语言标准给我们预定义了一系列的数据类型，我们逐一来思考这些数据类型关键字背后的逻辑是什么</p>

<p><span style="color:#1456f0">2.2.2.1.1</span> char</p>

<p>最小内存空间的数据类型，也是最适合操作硬件的数据类型。</p>

<p>我们知道硬件上最小的状态是高低电平，对于软件来讲就是0和1状态，那C语言中为什么没有bit这个数据类型关键字呢？因为0-1只有这两个状态，对于内存来讲当然是充分利用，但对于CPU来讲处理效率非常低。比如要把32（0b100000）这个数据从内存读到CPU内部寄存器，至少需要执行6个指令周期（1个指令周期：寻址-&gt;发读的控制信息-&gt;数据通过数据总线送到寄存器）才能读到0b100000。所以兼顾CPU性能和内存管理，计算机科学家把操作内存最小单位为8bit，也称1byte，也就是<span style="color:#d83931">char</span><span style="color:#d83931">类</span><span style="color:#d83931">型</span><span style="color:#d83931">，</span>可以表示256种状态。</p>

<p>当编译器看到char关键字的时候，就知道圈定的内存大小是1byte：</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">char</span> a = <span style="color:#986801">9</span>;
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a = %d, size of a is %ld byte \n&quot;</span>, a, <span style="color:#c18401">sizeof</span>(a));
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
a = <span style="color:#986801">10</span>, size of a is <span style="color:#986801">1</span> byte</code></pre>

<pre class="guide-code"><code>这里的 <span style="color:#986801">char</span> a = <span style="color:#986801">10</span>; 相当于在内存中圈出一块<span style="color:#986801">1b</span>yte的内存，内存的标签叫a（也可以理解成这块内
存属于a），内存里面的值是<span style="color:#986801">10</span>
Q：想一想，声明和定义的区别？<span style="color:#a626a4">extern</span> <span style="color:#986801">char</span> a 和 <span style="color:#986801">char</span> a；
A: 声明没有分配内存，定义会分配内存。</code></pre>

![原文图解（第 42 页）](assets/figures/p042-28.png)

<p>所以内存的访问的方式分成：标签访问和地址访问。可以这么理解，假设你要去访问你朋友的家。你朋友带你去就是标签访问，你自己根据目的地导航过去就是地址访问。</p>

<p>字符空间</p>

<p>char类型除了表示一个具体数字之外，它还可以描述字符空间，即ASCII码。在计算机的世界里，只认识01不认识字符，所以ASCII是人为定义的一套映射标准(见附录 7.1)。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">char</span> a = <span style="color:#50a14f">&#x27;a&#x27;</span>;
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a = %c, a ASCII = %d \n&quot;</span>, a, a);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
a = a, a ASCII = <span style="color:#986801">97</span></code></pre>

<pre class="guide-code"><code> 这里<span style="color:#986801">char</span> a = <span style="color:#50a14f">&#x27;a&#x27;</span> 等价于<span style="color:#986801">char</span> a = <span style="color:#986801">97</span></code></pre>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">char</span> a = <span style="color:#986801">97</span>;
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a = %c, a ASCII = %d \n&quot;</span>, a, a);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
a = a, a ASCII = <span style="color:#986801">97</span></code></pre>

<p><span style="color:#1456f0">2.2.2.1.2</span> int</p>

<p>最适合CPU的数据类型，大小跟编译器有关。</p>

![原文图解（第 44 页）](assets/figures/p044-00.png)

<p>为了充分发挥CPU的数据处理能力，数据总线尽量要充分利用，在系统一个周期内所能接受的最大处理单位就是int。所以32位的CPU，int就是32bit（4byte），16位的CPU，int就是16bit（2byte）。对于一个数字常量默认就是int的，体会以下代码：</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> a = <span style="color:#986801">10</span>;

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;size of 10 is: %ld \n&quot;</span>, <span style="color:#c18401">sizeof</span>(<span style="color:#986801">10</span>));
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;size of a is: %ld \n&quot;</span>, <span style="color:#c18401">sizeof</span>(a));
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;size of int is: %ld \n&quot;</span>, <span style="color:#c18401">sizeof</span>(<span style="color:#986801">int</span>));

    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
size of <span style="color:#986801">10</span> is: <span style="color:#986801">4</span>
size of a is: <span style="color:#986801">4</span>
size of <span style="color:#986801">int</span> is: <span style="color:#986801">4</span></code></pre>

<p><span style="color:#1456f0">2.2.2.1.3</span> short/long</p>

<p>short和long关键字本质是修饰int的，只是默认情况下我们用short和long类型的时候把int省略了。见名知意，short是减少int的空间，long是加大int的空间。具体的大小，由编译器决定</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">short</span> <span style="color:#986801">int</span> a = <span style="color:#986801">1</span>;
    <span style="color:#986801">short</span> b = <span style="color:#986801">1</span>;

    <span style="color:#986801">long</span> <span style="color:#986801">int</span> c = <span style="color:#986801">1</span>;
    <span style="color:#986801">long</span> d = <span style="color:#986801">1</span>;
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;size, a b: %ld, %ld byte; c d : %ld, %ld byte \n&quot;</span>,
         <span style="color:#c18401">sizeof</span>(a), <span style="color:#c18401">sizeof</span>(b), <span style="color:#c18401">sizeof</span>(c), <span style="color:#c18401">sizeof</span>(d));
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
size, a b: <span style="color:#986801">2</span>, <span style="color:#986801">2</span> byte; c d : <span style="color:#986801">8</span>, <span style="color:#986801">8</span> byte</code></pre>

<p><span style="color:#1456f0">2.2.2.1.4</span> signed/unsigned</p>

<p>这两个关键字用于圈定变量的区间范围。signed代表有符号数，最高位代表正负（1：代表负，0：代表正），区间范围从0为支点一分为半。如，char是8bit，所以signed char范围[-128, 127]，unsigned char范围[0, 255]。一般情况可以省略signed不写，int、long、short默认就是signed，但是char在C的标准中，允许定义为signed和unsigned，所以由编译器决定。可以测试一下你的机器上char是否是有符号数：</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">char</span> a = <span style="color:#986801">127</span>;

    <span style="color:#a626a4">if</span> (++a &gt; <span style="color:#986801">127</span>) {
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;char is unsigned \n&quot;</span>);
    } <span style="color:#a626a4">else</span> {
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;char is signed \n&quot;</span>);
    }

    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}</code></pre>

<p><span style="color:#1456f0">2.2.2.1.5</span> float/double</p>

<p>float和double是浮点类型，即可以表示小数。float是4字节，double是8个字节。在一般的嵌入式中，浮点的运算相比于整形要慢，如果算法没有太高的精度要求，建议尽量用整形。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;float</span><span style="color:#50a14f">：</span><span style="color:#50a14f">%ld double %ld\n&quot;</span>,<span style="color:#c18401">sizeof</span>(<span style="color:#986801">float</span>), <span style="color:#c18401">sizeof</span>(<span style="color:#986801">double</span>));
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
<span style="color:#986801">float</span>：<span style="color:#986801">4</span> <span style="color:#986801">double</span> <span style="color:#986801">8</span></code></pre>

<p>float和double是浮点类型在存储上存在精度，所以不能直接判断是否相等，而是人为的取一个精度，然后判断两个小数的模与这个精度的大小。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;math.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">float</span> a = <span style="color:#986801">1.0</span>;
    <span style="color:#986801">float</span> b = <span style="color:#986801">0.1</span>;

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;   a = %.10f b = %.10f \n&quot;</span>, a, b);
    <span style="color:#c18401">fabs</span>((a - b) - <span style="color:#986801">0.9</span>) &lt; <span style="color:#986801">0.000001</span> ?
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;   a - b equal 0.9\n&quot;</span>) :
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;   a - b not equal 0.9 \n&quot;</span>);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}</code></pre>

<p><span style="color:#1456f0">2.2.2.1.6</span> void</p>

<p>void类型不能用于定义变量，因为空大小的内存圈定没有意义。一般void用于函数占位符、void*、强制转换防止未用参数被编译器警告。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">void</span> a;
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
<span style="color:#986801">1.</span>c: In function ‘main’:
<span style="color:#986801">1.</span>c:<span style="color:#986801">5</span>:<span style="color:#986801">10</span>: error: variable <span style="color:#a626a4">or</span> field ‘a’ declared <span style="color:#986801">void</span>
    <span style="color:#986801">5</span> |     <span style="color:#986801">void</span> a;
      |</code></pre>

<p>占位符：表示无或者空</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">表</span><span style="color:#a0a1a7">示</span><span style="color:#a0a1a7">函</span><span style="color:#a0a1a7">数</span><span style="color:#a0a1a7">没</span><span style="color:#a0a1a7">有</span><span style="color:#a0a1a7">形</span><span style="color:#a0a1a7">参</span><span style="color:#a0a1a7">和</span><span style="color:#a0a1a7">返</span><span style="color:#a0a1a7">回</span><span style="color:#a0a1a7">值</span>
<span style="color:#986801">void</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
   <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;hello world \n&quot;</span>)；
}</code></pre>

<p>void *：表示数据空间</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">void</span> <span style="color:#4078f2">data_process</span>(<span style="color:#986801">void</span> *data，<span style="color:#986801">int</span> len)
{
    <span style="color:#986801">unsigned</span> <span style="color:#986801">char</span>* buff = (<span style="color:#986801">unsigned</span> <span style="color:#986801">char</span> *)data;
    <span style="color:#a626a4">for</span> (<span style="color:#986801">int</span> i = <span style="color:#986801">0</span>; i &lt; len; i++) {
        ...
        buff[i];
    }
}</code></pre>

<p>表示unused: </p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">void</span> <span style="color:#4078f2">func</span>(<span style="color:#986801">int</span> a)
{
    <span style="color:#986801">int</span> b;
    <span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">解</span><span style="color:#a0a1a7">决</span><span style="color:#a0a1a7">编</span><span style="color:#a0a1a7">译</span><span style="color:#a0a1a7">器</span><span style="color:#a0a1a7">报</span><span style="color:#a0a1a7">警</span><span style="color:#a0a1a7">告</span><span style="color:#a0a1a7">：</span><span style="color:#a0a1a7">参</span><span style="color:#a0a1a7">数</span><span style="color:#a0a1a7">定</span><span style="color:#a0a1a7">义</span><span style="color:#a0a1a7">未</span><span style="color:#a0a1a7">使</span><span style="color:#a0a1a7">用</span>
    (<span style="color:#986801">void</span>)a;
}</code></pre>

##### 2.2.2.2 自定义类型

<p>C语言默认定义的数据类型，不满足实际内存资源分配的。所以C语言支持在标准类型的基础上，通过组合来形成新的类型。本质上就是支持程序员根据实际需要来圈定内存的大小。</p>

![原文图解（第 48 页）](assets/figures/p048-03.png)

<p><span style="color:#1456f0">2.2.2.2.1</span> struct</p>

<p>C语言通过 struct 关键字表示新的组合类型，内存表现为累加且对齐，我们叫这种数据类型为<span style="color:#d83931">结</span><span style="color:#d83931">构</span><span style="color:#d83931">体</span>。声明的规则如下：</p>

<pre class="guide-code"><code><span style="color:#a626a4">struct</span> 名字 {
    <span style="color:#986801">char</span> b;
    <span style="color:#986801">int</span> a;
    ....
};

Q：下面这段代码有分配内存吗？
<span style="color:#a626a4">struct</span> <span style="color:#4078f2">abc</span> {
    <span style="color:#986801">int</span> a；
    <span style="color:#986801">char</span> b；
}；
A:这里只是声明，没有分配内存，a和b这里代表结构体的成员。</code></pre>

<p>结构体的初始化和访问</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#a626a4">struct</span> <span style="color:#4078f2">abc</span> {
    <span style="color:#986801">int</span> a;
    <span style="color:#986801">char</span> b;
};

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#a626a4">struct</span> <span style="color:#4078f2">abc</span> c = {
        .a = <span style="color:#986801">1</span>,
        .b = <span style="color:#50a14f">&#x27;c&#x27;</span>,
    };

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a = %d b = %c \n&quot;</span>,c.a, c.b);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
a = <span style="color:#986801">1</span> b = c</code></pre>

<p>字节对齐</p>

<p>什么是字节对齐，为什么要字节对齐？我们来体会一下下面这个例子：</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#a626a4">struct</span> <span style="color:#4078f2">abc</span> {
    <span style="color:#986801">char</span> b;
    <span style="color:#986801">int</span> a;
};

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#a626a4">struct</span> <span style="color:#4078f2">abc</span> c = {
        .a = <span style="color:#986801">1</span>,
        .b = <span style="color:#50a14f">&#x27;c&#x27;</span>,
    };

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;int:%ld byte, char:%ld byte, abc:%ld byte\n&quot;</span>,
            <span style="color:#c18401">sizeof</span>(<span style="color:#986801">int</span>), <span style="color:#c18401">sizeof</span>(<span style="color:#986801">char</span>), <span style="color:#c18401">sizeof</span>(<span style="color:#a626a4">struct</span> abc));
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
<span style="color:#986801">int</span>:<span style="color:#986801">4</span> byte, <span style="color:#986801">char</span>:<span style="color:#986801">1</span> byte,  abc:<span style="color:#986801">8</span> byte

可以看到，组合成新的结构体类型后，整体的内存变大了，不仅仅是简单的叠加。原因也很简单，就是
想要充分利用CPU，提升性能。在<span style="color:#986801">32</span>位的cpu中，每次读取的数据是<span style="color:#986801">4b</span>yte对齐访问，字节未对齐时，对
于成员变量a来说，需要读取两次才能拼凑成a的值；而对齐后，只需要一个机器周期就可以读取出来。
这也是典型通过空间换效率的例子。

Tips1：在定义结构体变量时，编译器默认会把首地址对齐到<span style="color:#986801">4</span>字节（跟具体体系结构有关，也可能是<span style="color:#986801">2</span>
个字节对齐）的倍数：首地址对齐
Tips2：边界对齐
<span style="color:#986801">1</span>、部分CPU硬件支持<span style="color:#336df4">非</span><span style="color:#336df4">对</span><span style="color:#336df4">齐</span><span style="color:#336df4">访</span><span style="color:#336df4">问</span>，典型的就是X86，X86硬件会自动处理非对齐访问情况，对软件透
明，代价是牺牲效率（纯硬件做的数据拼接）
<span style="color:#986801">2</span>、部分CPU“部分支持”非对齐访问，典型的就是ARM，其“单指令”操作支持非对齐，但“群指令”操作
(SIMD)则不支持(必须对齐访问)
<span style="color:#986801">3</span>、部分CPU硬件不支持对齐访问，但通过软件支持。典型的就是部分<span style="color:#336df4">mips</span><span style="color:#336df4">架构</span>，其通过内核中对
alignment fault异常处理流程中进行处理，比如将非对齐的数据访问，通过多次访存操作和拼接操作
来处理，也可以使用类似<span style="color:#336df4">memcpy</span>的方式来处理，当然代价是更严重的性能损失</code></pre>

![原文图解（第 50 页）](assets/figures/p050-18.png)

<pre class="guide-code"><code>Q：abc1 和 abc2 的内存空间一样吗？
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#a626a4">struct</span> <span style="color:#4078f2">abc1</span> {
    <span style="color:#986801">char</span> b;
    <span style="color:#986801">int</span> a;
    <span style="color:#986801">short</span> c;
};

<span style="color:#a626a4">struct</span> <span style="color:#4078f2">abc2</span> {
    <span style="color:#986801">char</span> b;
    <span style="color:#986801">short</span> c;
    <span style="color:#986801">int</span> a;
};
<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;abc1:%ld byte, abc2:%ld byte\n&quot;</span>, <span style="color:#c18401">sizeof</span>(<span style="color:#a626a4">struct</span> abc1), <span style="color:#c18401">sizeof</span>(<span style="color:#a626a4">struct</span>
 abc2));
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
abc1:<span style="color:#986801">12</span> byte, abc2:<span style="color:#986801">8</span> byte

大家可以自己尝试分析分析为什么不一样</code></pre>

<p>attribute((packed))</p>

<p>在数据传输的时候，往往需要知道真实的数据长度，这时候可以通过packed属性告诉编译器，不需要做字节对齐。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#a626a4">struct</span> <span style="color:#4078f2">abc</span> {
    <span style="color:#986801">char</span> b;
    <span style="color:#986801">int</span> a;
} __attribute__((packed));

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;int:%ld byte, char:%ld byte, abc:%ld byte\n&quot;</span>,
            <span style="color:#c18401">sizeof</span>(<span style="color:#986801">int</span>), <span style="color:#c18401">sizeof</span>(<span style="color:#986801">char</span>), <span style="color:#c18401">sizeof</span>(<span style="color:#a626a4">struct</span> abc));
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
<span style="color:#986801">int</span>:<span style="color:#986801">4</span> byte, <span style="color:#986801">char</span>:<span style="color:#986801">1</span> byte, abc:<span style="color:#986801">5</span> byte</code></pre>

<p><span style="color:#1456f0">2.2.2.2.2</span> union</p>

<p>union关键字表示新的类型叫联合体，内存表现为：<span style="color:#d83931">共</span><span style="color:#d83931">享一</span><span style="color:#d83931">份</span><span style="color:#d83931">内</span><span style="color:#d83931">存</span><span style="color:#d83931">(</span><span style="color:#d83931">以</span><span style="color:#d83931">最</span><span style="color:#d83931">大</span><span style="color:#d83931">数</span><span style="color:#d83931">据</span><span style="color:#d83931">类</span><span style="color:#d83931">型</span><span style="color:#d83931">作</span><span style="color:#d83931">为</span><span style="color:#d83931">分</span><span style="color:#d83931">配</span><span style="color:#d83931">空</span><span style="color:#d83931">间</span><span style="color:#d83931">)</span><span style="color:#d83931">和</span><span style="color:#d83931">内</span><span style="color:#d83931">存</span><span style="color:#d83931">的</span><span style="color:#d83931">首</span><span style="color:#d83931">地址</span>。声明的规则如下：</p>

<pre class="guide-code"><code><span style="color:#a626a4">union</span> 名字 {
    <span style="color:#986801">char</span> b;
    <span style="color:#986801">int</span> a;
    ....
};</code></pre>

<p>联合体的初始化和访问</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#a626a4">union</span> <span style="color:#4078f2">abc</span> {
    <span style="color:#986801">int</span> a;
    <span style="color:#986801">char</span> b;
};

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#a626a4">union</span> <span style="color:#4078f2">abc</span> c = {
        .a = <span style="color:#986801">1</span>,
    };
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a = %d b = %d \n&quot;</span>,c.a, c.b);

    c.b = <span style="color:#986801">100</span>;
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a = %d b = %d \n&quot;</span>,c.a, c.b);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
a = <span style="color:#986801">1</span> b = <span style="color:#986801">1</span>
a = <span style="color:#986801">100</span> b = <span style="color:#986801">100</span></code></pre>

![原文图解（第 52 页）](assets/figures/p052-41.png)

<p>识别计算机的大小端</p>

<p>大小端是计算器存储数据的一个规则，小端是低地址存放低位，高地址存放高位；大端则相反。一般像x86、arm都是小端，51单片机是大端。两种存储方式都是对的，可以通过联合体来判断大小端情况。</p>

![原文图解（第 53 页）](assets/figures/p053-03.png)

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">void</span> <span style="color:#4078f2">check_endian</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#a626a4">union</span> <span style="color:#4078f2">big_little</span> {
        <span style="color:#986801">int</span> a;
        <span style="color:#986801">char</span> b;
    } data;
    data.a = <span style="color:#986801">0x01</span>;

    <span style="color:#a626a4">if</span> (data.b == <span style="color:#986801">0x01</span>) {
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;little endian \n&quot;</span>);
    } <span style="color:#a626a4">else</span> {
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;big endian \n&quot;</span>);
    }
}
<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">check_endian</span>();
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}</code></pre>

<p>联合体+结构体设计数据包</p>

<p>在uart、usb、2.4G等等常见的数据包传输，会用到联合体+结构体的设计，这样的设计拓展性很强，符合开放封闭原则：拓展是开放的，修改是封闭的。可以体会一下下面这个例子：</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#a626a4">struct</span> <span style="color:#4078f2">abc</span> {
    <span style="color:#986801">int</span> a;
    <span style="color:#986801">short</span> b;
    <span style="color:#986801">long</span> c;
} __attribute__((packed));

<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">拓</span><span style="color:#a0a1a7">展</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">数</span><span style="color:#a0a1a7">据</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">构</span>
<span style="color:#a626a4">struct</span> <span style="color:#4078f2">efg</span> {
    <span style="color:#986801">char</span> e;
    <span style="color:#986801">float</span> f;
    <span style="color:#986801">int</span> g;
} __attribute__((packed));

<span style="color:#4078f2">#</span><span style="color:#a626a4">pragma</span><span style="color:#4078f2"> anon_unions</span>
<span style="color:#a626a4">struct</span> <span style="color:#4078f2">package</span> {
    <span style="color:#986801">unsigned</span> <span style="color:#986801">char</span> id;
    <span style="color:#a626a4">union</span> {
        <span style="color:#986801">unsigned</span> <span style="color:#986801">char</span> payload[<span style="color:#986801">24</span>];
        <span style="color:#a626a4">struct</span> <span style="color:#4078f2">abc</span> a;
        <span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">拓</span><span style="color:#a0a1a7">展</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">数</span><span style="color:#a0a1a7">据</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">构</span>
        <span style="color:#a626a4">struct</span> <span style="color:#4078f2">efg</span> b;
    };
};

<span style="color:#986801">void</span> <span style="color:#4078f2">send_package</span>(<span style="color:#986801">void</span>* data, <span style="color:#986801">int</span> len)
{
    <span style="color:#a626a4">struct</span> <span style="color:#4078f2">package</span> *p = (<span style="color:#a626a4">struct</span> package *)data;

    <span style="color:#c18401">uart_send</span>(p-&gt;id);
    <span style="color:#a626a4">for</span> (<span style="color:#986801">int</span> i = <span style="color:#986801">0</span>; i &lt; len; i++) {
        <span style="color:#c18401">uart_send</span>(p-&gt;payload[i]);
    }
}

可以看到，拓展的数据结构efg，不影响数据传输的功能，即send_package不需要修改。理论上支持无
限制的类型拓展。</code></pre>

<p><span style="color:#1456f0">2.2.2.2.3</span> enum</p>

<p>enum关键字表示的类型叫枚举类型，内存表现为：<span style="color:#d83931">内</span><span style="color:#d83931">存</span><span style="color:#d83931">根</span><span style="color:#d83931">据</span><span style="color:#d83931">定</span><span style="color:#d83931">义</span><span style="color:#d83931">值</span><span style="color:#d83931">的</span><span style="color:#d83931">大</span><span style="color:#d83931">小</span><span style="color:#d83931">默</span><span style="color:#d83931">认</span><span style="color:#d83931">选</span><span style="color:#d83931">择</span><span style="color:#d83931">整数</span><span style="color:#d83931">常</span><span style="color:#d83931">量</span><span style="color:#d83931">大</span><span style="color:#d83931">小</span><span style="color:#d83931">（</span><span style="color:#d83931">int</span><span style="color:#d83931">），</span><span style="color:#d83931">如</span><span style="color:#d83931">果</span><span style="color:#d83931">超</span><span style="color:#d83931">出</span><span style="color:#d83931">int</span><span style="color:#d83931">大</span><span style="color:#d83931">小</span><span style="color:#d83931">，</span><span style="color:#d83931">编</span><span style="color:#d83931">译</span><span style="color:#d83931">器</span><span style="color:#d83931">会</span><span style="color:#d83931">选</span><span style="color:#d83931">择</span><span style="color:#d83931">更</span><span style="color:#d83931">大</span><span style="color:#d83931">的</span><span style="color:#d83931">整</span><span style="color:#d83931">型</span><span style="color:#d83931">类</span><span style="color:#d83931">型</span><span style="color:#d83931">，</span><span style="color:#d83931">比</span><span style="color:#d83931">如</span><span style="color:#d83931">long</span><span style="color:#d83931">，</span><span style="color:#d83931">所</span><span style="color:#d83931">以</span><span style="color:#d83931">内</span><span style="color:#d83931">存</span><span style="color:#d83931">大</span><span style="color:#d83931">小</span><span style="color:#d83931">不</span><span style="color:#d83931">是</span><span style="color:#d83931">固</span><span style="color:#d83931">定</span><span style="color:#d83931">的</span>。声明的规则如下：</p>

<pre class="guide-code"><code><span style="color:#a626a4">enum</span> 名字 {
    A = <span style="color:#986801">200</span>,
    B = <span style="color:#986801">300</span>,
    C = <span style="color:#986801">321</span>
};</code></pre>

<p>enum的初始化和访问</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#a626a4">enum</span> <span style="color:#4078f2">abc</span> {
    A = <span style="color:#986801">0</span>,
    B = <span style="color:#986801">1</span>,
    C = <span style="color:#986801">3</span>,
    D
};

<span style="color:#a626a4">enum</span> <span style="color:#4078f2">efg</span> {
    E = <span style="color:#986801">0x123456789</span>,
    F,
    G
};

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a = %d, b = %d, c = %d, d = %d\n&quot;</span>,A, B, C, D);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;size of a = %ld, abc = %ld\n&quot;</span>,<span style="color:#c18401">sizeof</span>(A), <span style="color:#c18401">sizeof</span>(<span style="color:#a626a4">enum</span> abc));
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;size of E = %ld, abc = %ld\n&quot;</span>,<span style="color:#c18401">sizeof</span>(E), <span style="color:#c18401">sizeof</span>(<span style="color:#a626a4">enum</span> efg));
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
a = <span style="color:#986801">0</span>, b = <span style="color:#986801">1</span>, c = <span style="color:#986801">3</span>, d = <span style="color:#986801">4</span>
size of a = <span style="color:#986801">4</span>, abc = <span style="color:#986801">4</span> <span style="color:#a0a1a7">//int</span>
size of E = <span style="color:#986801">8</span>, efg = <span style="color:#986801">8</span> <span style="color:#a0a1a7">//long int</span></code></pre>

<p>enum在C语言中只是一个建议性关键字</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#a626a4">enum</span> <span style="color:#4078f2">abc</span> {
    A = <span style="color:#986801">0</span>,
    B = <span style="color:#986801">1</span>,
    C = <span style="color:#986801">3</span>,
    D
};

<span style="color:#a626a4">enum</span> abc <span style="color:#4078f2">func</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#a626a4">return</span> <span style="color:#986801">10</span>;
}

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#a626a4">enum</span> <span style="color:#4078f2">abc</span> a = <span style="color:#c18401">func</span>();

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a = %d \n&quot;</span>, a);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
a = <span style="color:#986801">10</span>

Tips: 在C++ <span style="color:#986801">11</span>这会编译报错。</code></pre>

<p>enum和宏的差别</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> A 0</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> B 1</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> C 3</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> D 4</span>

<span style="color:#a626a4">enum</span> <span style="color:#4078f2">abc</span> {
    A = <span style="color:#986801">0</span>,
    B = <span style="color:#986801">1</span>,
    C = <span style="color:#986801">3</span>,
    D
};

在C语言中，对于上面这段代码使用上几乎等价。</code></pre>

##### 2.2.2.3 地址（指针）类型

<p>C语言中，地址类型也称指针类型，圈定的内存用来存放地址编号的值。指针类型的内存表现<span style="color:#d83931">跟</span><span style="color:#d83931">编</span><span style="color:#d83931">译</span><span style="color:#d83931">器</span><span style="color:#d83931">有</span><span style="color:#d83931">关</span><span style="color:#d83931">或</span><span style="color:#d83931">者</span><span style="color:#d83931">说</span><span style="color:#d83931">跟</span><span style="color:#d83931">CPU</span><span style="color:#d83931">的</span><span style="color:#d83931">地址</span><span style="color:#d83931">总</span><span style="color:#d83931">线</span><span style="color:#d83931">有</span><span style="color:#d83931">关</span>。在32位的系统中，指针类型占用4byte，在64位的系统中，指针类型占用8byte。</p>

![原文图解（第 57 页）](assets/figures/p057-03.png)

<p>声明的规则如下：</p>

<pre class="guide-code"><code>数据类型 *</code></pre>

<p>指针变量初始化和访问</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> a = <span style="color:#986801">10</span>;
    <span style="color:#986801">int</span> *p = &amp;a;

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;symbol visit</span><span style="color:#50a14f">：</span><span style="color:#50a14f">a = %d, addr visit</span><span style="color:#50a14f">：</span><span style="color:#50a14f">a = %d\n&quot;</span>, a, *p);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}
<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
symbol visit：a = <span style="color:#986801">10</span>, addr visit：a = <span style="color:#986801">10</span>

<span style="color:#986801">1</span>、首先，p也是一个变量（没啥神秘的），这本质上也是圈定一块内存，内存的大小跟编译器有关，p
是这块内存的标签。到这里p和a的在变量的视角中一摸一样
<span style="color:#986801">2</span>、然后，p的特殊性在于，它圈定的那块内存，存放的不是一般的值而是一个地址编号。所以除了通过
标签p读出这个地址编号外，C语言还提供一种直接访问这个地址编号的方法，那就是在p前面加一个*
号。
举一个形象的例子：
你要去访问A朋友家，第一种是直接让A带你去，第二种是P知道A家的地址，通过P带你去。a 和 *p就
是这种感觉</code></pre>

![原文图解（第 58 页）](assets/figures/p058-06.png)

<p>指针类型的内存大小跟数据类型没有关系</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#a626a4">struct</span> <span style="color:#4078f2">abc</span> {
    <span style="color:#986801">int</span> a;
    <span style="color:#986801">int</span> b;
    <span style="color:#986801">float</span> c;
};

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">char</span> *p1;
    <span style="color:#986801">int</span> *p2 ;
    <span style="color:#a626a4">struct</span> <span style="color:#4078f2">abc</span> *p3;

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;size of p1:%ld, p2:%ld, p3:%ld\n&quot;</span>, <span style="color:#c18401">sizeof</span>(p1), <span style="color:#c18401">sizeof</span>(p2),
<span style="color:#c18401">sizeof</span>(p3));
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}
<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
size of p1:<span style="color:#986801">8</span>, p2:<span style="color:#986801">8</span>, p3:<span style="color:#986801">8</span></code></pre>

<p>后续会有专门的一part来介绍指针的使用，大家先了解指针类型的基本思想。</p>

##### 2.2.2.4 typedef

<p>typedef关键字是给数据类型起一个别名，让程序的可读性更高，特别是复杂的类型（如函数指针类型），做到见字知意。使用的规则如下：</p>

<pre class="guide-code"><code><span style="color:#a626a4">typedef</span> 数据类型 别名</code></pre>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#a626a4">typedef</span> <span style="color:#a626a4">struct</span> <span style="color:#4078f2">abc</span> {
    <span style="color:#986801">int</span> a;
    <span style="color:#986801">int</span> b;
    <span style="color:#986801">float</span> c;
} <span style="color:#986801">abc_t</span>;

<span style="color:#a626a4">typedef</span> <span style="color:#986801">int</span> <span style="color:#986801">len_t</span>;
<span style="color:#a626a4">typedef</span> <span style="color:#986801">unsigned</span> <span style="color:#986801">char</span> <span style="color:#986801">uint8_t</span>;
<span style="color:#a626a4">typedef</span> <span style="color:#4078f2">void</span> (func*)(<span style="color:#986801">void</span>);
func p;

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">len_t</span> a = <span style="color:#986801">0</span>;
    <span style="color:#986801">uint8_t</span> b;
    <span style="color:#986801">abc_t</span> c;

    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}</code></pre>

<p>体会typedef 和 #define 的区别</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> uint8 unsigned char</span>
<span style="color:#a626a4">typedef</span> <span style="color:#986801">unsigned</span> <span style="color:#986801">char</span> <span style="color:#986801">uint8_t</span>;

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    uint8 a = <span style="color:#50a14f">&#x27;c&#x27;</span>;
    <span style="color:#986801">uint8_t</span> b = <span style="color:#50a14f">&#x27;c&#x27;</span>;

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a = %c, b = %c \n&quot;</span>, a, b);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
a = c, b = c</code></pre>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> uchar_p unsigned char *</span>
<span style="color:#a626a4">typedef</span> <span style="color:#986801">unsigned</span> <span style="color:#986801">char</span> * uint8_p;

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    uchar_p a, b;
    uint8_p c, d;

    a = <span style="color:#50a14f">&quot;hello&quot;</span>;
    b = <span style="color:#50a14f">&quot;hello&quot;</span>;<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">这</span><span style="color:#a0a1a7">里</span><span style="color:#a0a1a7">b</span><span style="color:#a0a1a7">是</span><span style="color:#a0a1a7">unsigned char</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">不</span><span style="color:#a0a1a7">是</span><span style="color:#a0a1a7"> unsigned char *</span>
    c = <span style="color:#50a14f">&quot;hello&quot;</span>;
    d = <span style="color:#50a14f">&quot;hello&quot;</span>;

    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
<span style="color:#986801">1.</span>c: In function ‘main’:
<span style="color:#986801">1.</span>c:<span style="color:#986801">12</span>:<span style="color:#986801">7</span>: warning: assignment to ‘<span style="color:#986801">unsigned</span> <span style="color:#986801">char</span>’ from ‘<span style="color:#986801">char</span> *’ makes integer
from pointer without a cast [-Wint-conversion]
   <span style="color:#986801">12</span> |     b = <span style="color:#50a14f">&quot;hello&quot;</span>;<span style="color:#a0a1a7">//</span>
      |

<span style="color:#646a73">#</span><span style="color:#646a73">宏</span><span style="color:#646a73">展</span><span style="color:#646a73">开</span><span style="color:#646a73">后</span><span style="color:#646a73">的</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span><span style="color:#646a73">：</span>
<span style="color:#a626a4">typedef</span> <span style="color:#986801">unsigned</span> <span style="color:#986801">char</span> * uint8_p;

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">unsigned</span> <span style="color:#986801">char</span> * a, b;<span style="color:#a0a1a7">//b </span><span style="color:#a0a1a7">是</span><span style="color:#a0a1a7"> unsigned char</span>
    uint8_p c, d;、</code></pre>

<pre class="guide-code"><code>    a = <span style="color:#50a14f">&quot;hello&quot;</span>;
    b = <span style="color:#50a14f">&quot;hello&quot;</span>;
    c = <span style="color:#50a14f">&quot;hello&quot;</span>;
    d = <span style="color:#50a14f">&quot;hello&quot;</span>;

    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}</code></pre>

#### 2.2.3 修饰关键字

<p>我们知道数据类型关键字的作用是告诉编译器圈定内存的大小。但实际工程应用中，只有大小的限制是不够的。想一想，我们的内存空间这么大（32位系统为例，有4G的内存寻址空间），该从哪个地方圈定内存呢？是全部区域都可以吗？分配给你的内存空间，要不要有些操作做限定呢？这些都是需要修饰关键字来告诉编译器该怎么来做。</p>

##### 2.2.3.1 auto

<p>auto关键字是最无感的存在。编译器在默认缺省的情况下，所有变量都是auto的。你就当做它不存在，不曾来过。</p>

##### 2.2.3.2 register

<p>register关键字是一个建议性关键字。设计的初衷是想要定义的变量放到cpu的寄存器中，但是往往编译器看到这个关键字的时候，发出一句呐喊：臣妾做不到啊。寄存器相对于内存，cpu在访问速度上更快，但也很稀缺，不是说想放就放的。所以编译器只能尽量的去做，它不保证一定能做得到，大家也就不要奢望了。但值得注意的是加上register修饰后的变量，无法通过&amp;来取地址。即使大概率放进寄存器会失败，但编译器就不给你寻址，万一成功了呢？编译器还是有梦想的。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#a626a4">register</span> <span style="color:#986801">char</span> a = <span style="color:#986801">1</span>;

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a = %d , addr of a:%p&quot;</span>, a, &amp;a);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
<span style="color:#986801">1.</span>c: In function ‘main’:
<span style="color:#986801">1.</span>c:<span style="color:#986801">6</span>:<span style="color:#986801">5</span>: error: address of global <span style="color:#a626a4">register</span> variable ‘a’ requested
    <span style="color:#986801">6</span> |     <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a = %d , addr of a:%p&quot;</span>, a, &amp;a);
      |     ^~~~~~</code></pre>

##### 2.2.3.3 static

<p>在C语言中static关键字有两个作用：1、变量的内存从静态全局数据区分配；2、限定变量或函数的作用域</p>

<p><span style="color:#1456f0">2.2.3.3.1</span> 修饰变量</p>

<p>生命周期：不管是修饰局部变量还是全局变量，最后都在静态全局数据区分配。这意味着变量在整个程序的生命周期内都是有效合法的。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">static</span> <span style="color:#986801">int</span> a = <span style="color:#986801">20</span>;
<span style="color:#986801">int</span> <span style="color:#4078f2">func</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">static</span> <span style="color:#986801">int</span> b = <span style="color:#986801">10</span>;
    <span style="color:#a626a4">return</span> ++b;
}

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a = %d , b = %d ,b = %d \n&quot;</span>, a, <span style="color:#c18401">func</span>(), <span style="color:#c18401">func</span>());
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}
<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
a = <span style="color:#986801">20</span> , b = <span style="color:#986801">12</span> ,b = <span style="color:#986801">11</span></code></pre>

<p>限定范围：限定全局变量只在当前定义的文件可见，其他文件即使加上extern修饰，也无法引用。会编译报错</p>

<pre class="guide-code"><code><span style="color:#a0a1a7">//1.c</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">static</span> <span style="color:#986801">int</span> a = <span style="color:#986801">20</span>;

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a = %d\n&quot;</span>, a);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#a0a1a7">//2.c</span>
<span style="color:#a626a4">extern</span> <span style="color:#986801">int</span> a;
<span style="color:#986801">int</span> <span style="color:#4078f2">func</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#a626a4">return</span> ++a;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
/usr/bin/ld: <span style="color:#986801">2.</span>o: in function `func<span style="color:#986801">&#x27;</span>:
<span style="color:#986801">2.</span>c:(.text+<span style="color:#986801">0xa</span>): undefined reference to `a<span style="color:#986801">&#x27;</span>
/usr/bin/ld: <span style="color:#986801">2.</span>c:(.text+<span style="color:#986801">0x13</span>): undefined reference to `a<span style="color:#986801">&#x27;</span>
/usr/bin/ld: <span style="color:#986801">2.</span>c:(.text+<span style="color:#986801">0x19</span>): undefined reference to `a<span style="color:#986801">&#x27;</span>
collect2: error: ld returned <span style="color:#986801">1</span> exit status</code></pre>

<p><span style="color:#1456f0">2.2.3.3.2</span> 修饰函数</p>

<p>限定范围：限定函数在当前定义的文件可见，其他文件不可引用，但可以实现相同名字的函数(也需要用static修饰)，互不影响。感受一下下面这个例子：</p>

<pre class="guide-code"><code><span style="color:#a0a1a7">//1.c</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">static</span> <span style="color:#986801">int</span> a = <span style="color:#986801">20</span>;
<span style="color:#986801">static</span> <span style="color:#986801">int</span> <span style="color:#4078f2">func</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#a626a4">return</span> ++a;
}

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a = %d\n&quot;</span>, <span style="color:#c18401">func</span>());
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#a0a1a7">//2.c</span>
<span style="color:#986801">static</span> <span style="color:#986801">int</span> a = <span style="color:#986801">10</span>;
<span style="color:#986801">static</span> <span style="color:#986801">int</span> <span style="color:#4078f2">func</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#a626a4">return</span> ++a;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
a = <span style="color:#986801">21</span></code></pre>

##### 2.2.3.4 extern

<p>extern用来声明一个没有被static修饰的变量或者函数。</p>

<pre class="guide-code"><code><span style="color:#a0a1a7">//1.c</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#a626a4">extern</span> <span style="color:#986801">int</span> <span style="color:#4078f2">func</span>(<span style="color:#986801">void</span>);
<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">func</span>();
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#a0a1a7">//2.c</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#986801">int</span> <span style="color:#4078f2">func</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;func call \n&quot;</span>);
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
func call</code></pre>

<p>在架构设计中尽量不要用extern，会导致代码耦合度非常高而且不太可控。建议参考如下方案：</p>

<pre class="guide-code"><code><span style="color:#a0a1a7">//1.c</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&quot;2.h&quot;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">set_a</span>(<span style="color:#986801">20</span>);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a = %d\n&quot;</span>, <span style="color:#c18401">read_a</span>());
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#a0a1a7">//2.h</span>
<span style="color:#986801">void</span> <span style="color:#4078f2">set_a</span>(<span style="color:#986801">int</span> value);
<span style="color:#986801">int</span> <span style="color:#4078f2">read_a</span>(<span style="color:#986801">void</span>);

<span style="color:#a0a1a7">//2.c</span>
<span style="color:#986801">static</span> <span style="color:#986801">int</span> a = <span style="color:#986801">10</span>;
<span style="color:#986801">void</span> <span style="color:#4078f2">set_a</span>(<span style="color:#986801">int</span> value)
{
    <span style="color:#c18401">mutex_lock</span>();
    a = value;
    <span style="color:#c18401">mutex_unlock</span>();
}
<span style="color:#986801">int</span> <span style="color:#4078f2">read_a</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#a626a4">return</span> a;
}</code></pre>

<p>extern &quot;C&quot;，用C++的编译器（g++）按照C的规则进行编译。C++和C语言在编译规则上有很多不同，所以在C++中想完全复用C写的代码，就可以用extern &quot;C&quot;来修饰。这种在C++使用C的lib库的时候比较常见。另外，面试也很喜欢问这个。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">void</span> <span style="color:#4078f2">func</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;func call \n&quot;</span>);
}
<span style="color:#a0a1a7">//FPIC </span><span style="color:#a0a1a7">生</span><span style="color:#a0a1a7">成</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">so</span><span style="color:#a0a1a7">库</span><span style="color:#a0a1a7">跟</span><span style="color:#a0a1a7">绝</span><span style="color:#a0a1a7">对</span><span style="color:#a0a1a7">代</span><span style="color:#a0a1a7">码</span><span style="color:#a0a1a7">位</span><span style="color:#a0a1a7">置</span><span style="color:#a0a1a7">无</span><span style="color:#a0a1a7">关</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">可</span><span style="color:#a0a1a7">以</span><span style="color:#a0a1a7">在</span><span style="color:#a0a1a7">任</span><span style="color:#a0a1a7">意</span><span style="color:#a0a1a7">位</span><span style="color:#a0a1a7">置</span><span style="color:#a0a1a7">被</span><span style="color:#a0a1a7">引</span><span style="color:#a0a1a7">用</span>
<span style="color:#a0a1a7">//-shared </span><span style="color:#a0a1a7">共</span><span style="color:#a0a1a7">享</span><span style="color:#a0a1a7">库</span>
gcc -o libfunc.so <span style="color:#986801">2.</span>c -fPIC -shared</code></pre>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#4078f2">#</span><span style="color:#a626a4">if</span><span style="color:#4078f2"> defined(__cplusplus)</span>
<span style="color:#a626a4">extern</span> <span style="color:#50a14f">&quot;C&quot;</span> {
<span style="color:#4078f2">#</span><span style="color:#a626a4">endif</span>
<span style="color:#986801">void</span> <span style="color:#4078f2">func</span>(<span style="color:#986801">void</span>);
<span style="color:#4078f2">#</span><span style="color:#a626a4">if</span><span style="color:#4078f2"> defined(__cplusplus)</span>
}
<span style="color:#4078f2">#</span><span style="color:#a626a4">endif</span></code></pre>

<pre class="guide-code"><code><span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">func</span>();
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#a626a4">export</span> LD_LIBRARY_PATH=$LD_LIBRARY_PATH:./
g++ -o bin <span style="color:#986801">1.</span>c -lfunc -L.
./bin
<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
func call</code></pre>

##### 2.2.3.5 const

<p>const是constant的缩写，是恒定不变的意思，被修饰的变量经常被人误解成常数或者常量。这个理解不太准确，准确的理解应该是read only。本质上还是变量，编译器只能尽量的不让你去修改，但是实际上总有一些方法可以做到修改const 修饰变量的值，往往都是一些异常的操作导致（比如数组越界、指针越界访问、栈溢出等等）。我们要建立一个正确的编程理念：const 修饰的变量技术上能改，但是不要去改。</p>

<pre class="guide-code"><code><span style="color:#986801">const</span> 数据类型 变量名 <span style="color:#a626a4">or</span> 数据类型 <span style="color:#986801">const</span> 变量名

<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">const</span> <span style="color:#986801">int</span> a = <span style="color:#986801">10</span>;
    <span style="color:#986801">int</span> <span style="color:#986801">const</span> b = <span style="color:#986801">20</span>;

    <span style="color:#a0a1a7">//a = 20;//</span><span style="color:#a0a1a7">编</span><span style="color:#a0a1a7">译</span><span style="color:#a0a1a7">错</span><span style="color:#a0a1a7">误</span><span style="color:#a0a1a7">,</span><span style="color:#a0a1a7">编</span><span style="color:#a0a1a7">译</span><span style="color:#a0a1a7">不</span><span style="color:#a0a1a7">给</span><span style="color:#a0a1a7">修</span><span style="color:#a0a1a7">改</span>
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a = %d, b = %d\n&quot;</span>, a, b);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}</code></pre>

<p>修改const修饰的变量</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> a = <span style="color:#986801">1234568</span>;
    <span style="color:#986801">const</span> <span style="color:#986801">int</span> b = <span style="color:#986801">11111111</span>;
    <span style="color:#986801">int</span> *p = &amp;a;

    p[<span style="color:#986801">1</span>] = <span style="color:#986801">22222222</span>;
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;b = %d \n&quot;</span>, b);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}</code></pre>

<p>const 修饰指针</p>

<p>很多同学对const修饰指针变量，有时候分不清楚是修饰指针变量还是限定指针指向的内容。今天教大家一个方法，叫<span style="color:#d83931">&quot;</span><span style="color:#d83931">近</span><span style="color:#d83931">水</span><span style="color:#d83931">楼</span><span style="color:#d83931">台</span><span style="color:#d83931">先</span><span style="color:#d83931">得</span><span style="color:#d83931">月</span><span style="color:#d83931">&quot;</span>：</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">const</span> <span style="color:#986801">int</span> * a;  <span style="color:#a0a1a7">//-&gt; const * a -&gt;</span><span style="color:#a0a1a7">靠</span><span style="color:#a0a1a7">近</span><span style="color:#a0a1a7"> *</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">所</span><span style="color:#a0a1a7">以</span><span style="color:#a0a1a7"> </span>地址指向的内容（*a）不能变
<span style="color:#986801">int</span> <span style="color:#986801">const</span> * b;  <span style="color:#a0a1a7">//-&gt; const * b -&gt;</span><span style="color:#a0a1a7">靠</span><span style="color:#a0a1a7">近</span><span style="color:#a0a1a7"> *</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">所</span><span style="color:#a0a1a7">以</span><span style="color:#a0a1a7"> </span>地址指向的内容（*d）不能变
<span style="color:#986801">int</span> * <span style="color:#986801">const</span> c; <span style="color:#a0a1a7">//-&gt; * const c -&gt;</span><span style="color:#a0a1a7">靠</span><span style="color:#a0a1a7">近</span><span style="color:#a0a1a7"> c</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">所</span><span style="color:#a0a1a7">以</span><span style="color:#a0a1a7"> c</span><span style="color:#a0a1a7">指</span><span style="color:#a0a1a7">针</span><span style="color:#a0a1a7">变</span><span style="color:#a0a1a7">量</span>不能变
<span style="color:#986801">const</span> <span style="color:#986801">int</span> * <span style="color:#986801">const</span> d; <span style="color:#a0a1a7">//-&gt; const * const d -&gt;</span><span style="color:#a0a1a7">靠</span><span style="color:#a0a1a7">近</span><span style="color:#a0a1a7"> * </span><span style="color:#a0a1a7">又</span><span style="color:#a0a1a7">靠</span><span style="color:#a0a1a7">近</span><span style="color:#a0a1a7">c</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">所</span><span style="color:#a0a1a7">以</span><span style="color:#a0a1a7">d</span><span style="color:#a0a1a7">和</span><span style="color:#a0a1a7">*d</span><span style="color:#a0a1a7">都</span>不能变

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">下</span><span style="color:#a0a1a7">面</span><span style="color:#a0a1a7">5</span><span style="color:#a0a1a7">个</span><span style="color:#a0a1a7">语</span><span style="color:#a0a1a7">句</span><span style="color:#a0a1a7">编</span><span style="color:#a0a1a7">译</span><span style="color:#a0a1a7">器</span><span style="color:#a0a1a7">会</span><span style="color:#a0a1a7">报</span><span style="color:#a0a1a7">错</span><span style="color:#a0a1a7">拦</span><span style="color:#a0a1a7">截</span>
    *a = <span style="color:#986801">1</span>;
    *b = <span style="color:#986801">1</span>;
    c = <span style="color:#986801">1</span>;
    *d = <span style="color:#986801">1</span>;
    d = <span style="color:#986801">1</span>;

    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}
<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">编</span><span style="color:#a0a1a7">译</span><span style="color:#a0a1a7">器</span><span style="color:#a0a1a7">报</span><span style="color:#a0a1a7">错</span>
<span style="color:#986801">1.</span>c: In function ‘main’:
<span style="color:#986801">1.</span>c:<span style="color:#986801">11</span>:<span style="color:#986801">8</span>: error: assignment of read-only location ‘*a’
   <span style="color:#986801">11</span> |     *a = <span style="color:#986801">1</span>;
      |        ^
<span style="color:#986801">1.</span>c:<span style="color:#986801">12</span>:<span style="color:#986801">8</span>: error: assignment of read-only location ‘*b’
   <span style="color:#986801">12</span> |     *b = <span style="color:#986801">1</span>;
      |        ^
<span style="color:#986801">1.</span>c:<span style="color:#986801">13</span>:<span style="color:#986801">7</span>: error: assignment of read-only variable ‘c’
   <span style="color:#986801">13</span> |     c = <span style="color:#986801">1</span>;
      |       ^
<span style="color:#986801">1.</span>c:<span style="color:#986801">14</span>:<span style="color:#986801">8</span>: error: assignment of read-only location ‘*d’
   <span style="color:#986801">14</span> |     *d = <span style="color:#986801">1</span>;
      |        ^
<span style="color:#986801">1.</span>c:<span style="color:#986801">15</span>:<span style="color:#986801">7</span>: error: assignment of read-only variable ‘d’
   <span style="color:#986801">15</span> |     d = <span style="color:#986801">1</span>;
      |       ^
    ^</code></pre>

<p>使用const可以提高运行效率：如果用const修饰，编译器会直接把立即数200赋值给变量a，而没有const修饰的则每次都需要读取内存中ABC值。这样用const修饰时，执行效率就比较高（我们知道读取内存是相对慢的操作）。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">const</span> <span style="color:#986801">int</span> ABC = <span style="color:#986801">200</span>;
<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> a = ABC;
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}</code></pre>

<pre class="guide-code"><code><span style="color:#a0a1a7">//int a = ABC;</span>
movl    <span style="color:#4078f2">ABC</span>(%rip), %eax <span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">把</span><span style="color:#a0a1a7">内</span><span style="color:#a0a1a7">存</span><span style="color:#a0a1a7">中</span><span style="color:#a0a1a7">ABC</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">值</span><span style="color:#a0a1a7">读</span><span style="color:#a0a1a7">到</span><span style="color:#a0a1a7">寄存</span><span style="color:#a0a1a7">器</span><span style="color:#a0a1a7">中</span><span style="color:#a0a1a7">去</span>
movl    %eax, -4(%rbp)

<span style="color:#a0a1a7">//const int a = ABC;</span>
movl    $200, -4(%rbp)</code></pre>

<p>const和宏的区别</p>

<p>const设计的初衷就是为了代替宏，消除它的缺点，继承它的优点。</p>

<p><span style="color:#1456f0">1.</span> 编译器处理方式：define宏是在预处理阶段展开；const变量是编译运行阶段使用</p>

<p><span style="color:#1456f0">2.</span> 安全检查：define宏不做任何类型检查，仅仅是展开；const变量编译阶段会执行类型检查</p>

<p><span style="color:#1456f0">3.</span> 内存位置：define宏在代码段；const常量可以在静态全局数据段、栈中</p>

##### 2.2.3.6 volatile

<p>volatile关键字用于告诉编译器，被声明为 volatile 的变量的值可能在程序的控制之外发生变化，因此编译器不应该对其进行某些优化。主要用于处理硬件寄存器、中断服务程序和多线程等情况：下面如果buff变量是uart的DR寄存器映射，即使代码中没有地方更新buff的值，也应该告诉编译器不要优化，如果有地方读取buff的值的时候，都需要从内存中读取，因为外部uart会触发更新。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#a626a4">volatile</span> <span style="color:#986801">unsigned</span> <span style="color:#986801">char</span> buff;

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#a626a4">while</span> (buff) {<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">等</span><span style="color:#a0a1a7">待</span><span style="color:#a0a1a7">buff</span><span style="color:#a0a1a7">不为</span><span style="color:#a0a1a7">0</span>
        <span style="color:#a0a1a7">//do something</span>
    }
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}</code></pre>

![原文图解（第 69 页）](assets/figures/p069-00.png)

<p>体会一下下面这个例子：</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdlib.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;unistd.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;pthread.h&gt;</span>

<span style="color:#986801">static</span> <span style="color:#a626a4">volatile</span> <span style="color:#986801">int</span> wait = <span style="color:#986801">1</span>;

<span style="color:#986801">void</span>* <span style="color:#4078f2">function</span>(<span style="color:#986801">void</span>* arg)
{
    <span style="color:#a626a4">while</span> (<span style="color:#986801">1</span>) {
        <span style="color:#c18401">sleep</span>(<span style="color:#986801">1</span>);
        wait = <span style="color:#986801">0</span>;
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;flag wait = %d in thread \n&quot;</span>, wait);
    }
    <span style="color:#a626a4">return</span> <span style="color:#0184bb">NULL</span>;
}
<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">pthread_t</span> tid;
    <span style="color:#c18401">pthread_create</span>(&amp;tid, <span style="color:#0184bb">NULL</span>, function, <span style="color:#0184bb">NULL</span>);

    <span style="color:#a626a4">while</span>(wait);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;flag wait = %d in main \n&quot;</span>, wait);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}
gcc -o bin <span style="color:#986801">1.</span>c -lpthread -O3
./bin
<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
当wait不加<span style="color:#a626a4">volatile</span>时，程序出现死循环

#体会一下两种情况的下汇编
<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">不</span><span style="color:#a0a1a7">加</span><span style="color:#a0a1a7">volatile</span><span style="color:#a0a1a7">时</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">while(wait)</span>
        movl        <span style="color:#4078f2">wait</span>(%rip), %eax
        testl        %eax, %eax
        je        .L6
.L7:
        jmp        .L7

<span style="color:#646a73">//</span><span style="color:#646a73">加</span><span style="color:#646a73">volatile</span><span style="color:#646a73">时</span><span style="color:#646a73">，</span><span style="color:#646a73">while(wait)</span>
.L6:
        movl        wait(%rip), %eax
        testl        %eax, %eax
        jne        .L6</code></pre>

#### 2.2.4 逻辑关键字

<p>在cpu的眼里很单纯，程序指针（PC）指到哪里就执行哪里，默认情况下顺序往下执行，而<span style="color:#d83931">逻</span><span style="color:#d83931">辑</span><span style="color:#d83931">关</span><span style="color:#d83931">键</span><span style="color:#d83931">字</span>作用就是改变PC指针的指向，这个最基本的思想就构成了程序里各种逻辑设计（条件、选择、跳转、循环）。</p>

![原文图解（第 70 页）](assets/figures/p070-39.png)

##### 2.2.4.1 条件：if、else

<p>条件逻辑关键字，判断条件表达式是否为真，为真后停止判断并进入处理对应逻辑。</p>

<pre class="guide-code"><code><span style="color:#a626a4">if</span> (条件表达式)
    xx；<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">表</span><span style="color:#a0a1a7">达</span><span style="color:#a0a1a7">式</span><span style="color:#a0a1a7">为</span><span style="color:#a0a1a7">真</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">进</span><span style="color:#a0a1a7">来</span><span style="color:#a0a1a7">此</span><span style="color:#a0a1a7">分</span><span style="color:#a0a1a7">支</span>
<span style="color:#a626a4">else</span> <span style="color:#a626a4">if</span>(条件表达式)
    yy;
....
<span style="color:#a626a4">else</span>
    zz；</code></pre>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> a = <span style="color:#986801">2</span>;

    <span style="color:#a626a4">if</span> (a == <span style="color:#986801">1</span>) {
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;hello 1 \n&quot;</span>);
    } <span style="color:#a626a4">else</span> <span style="color:#a626a4">if</span> (<span style="color:#986801">2</span> == a)) {
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;hello 2 \n&quot;</span>);
    } <span style="color:#a626a4">else</span> {
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;hello a = %d \n&quot;</span>, a);
    }
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
hello <span style="color:#986801">2</span></code></pre>

##### 2.2.4.2 选择：swtich、case、default

<p>选择逻辑关键字基于某个表达式的值选择不同的执行路径。它的基本语法如下：</p>

<pre class="guide-code"><code><span style="color:#a626a4">switch</span> (表达式  整形数字) {
    <span style="color:#a626a4">case</span> 值<span style="color:#986801">1</span>:
        <span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">当</span><span style="color:#a0a1a7">表</span><span style="color:#a0a1a7">达</span><span style="color:#a0a1a7">式</span><span style="color:#a0a1a7">等</span><span style="color:#a0a1a7">于</span><span style="color:#a0a1a7">值</span><span style="color:#a0a1a7">1</span><span style="color:#a0a1a7">时</span><span style="color:#a0a1a7">执</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">代</span><span style="color:#a0a1a7">码</span>
        <span style="color:#a626a4">break</span>;
    <span style="color:#a626a4">case</span> 值<span style="color:#986801">2</span>:
        <span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">当</span><span style="color:#a0a1a7">表</span><span style="color:#a0a1a7">达</span><span style="color:#a0a1a7">式</span><span style="color:#a0a1a7">等</span><span style="color:#a0a1a7">于</span><span style="color:#a0a1a7">值</span><span style="color:#a0a1a7">2</span><span style="color:#a0a1a7">时</span><span style="color:#a0a1a7">执</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">代</span><span style="color:#a0a1a7">码</span>
        <span style="color:#a626a4">break</span>;
    <span style="color:#a0a1a7">//....</span>
    <span style="color:#a626a4">default</span>:
        <span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">如</span><span style="color:#a0a1a7">果</span><span style="color:#a0a1a7">表</span><span style="color:#a0a1a7">达</span><span style="color:#a0a1a7">式</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">值</span><span style="color:#a0a1a7">与</span><span style="color:#a0a1a7">所</span><span style="color:#a0a1a7">有</span><span style="color:#a0a1a7">case</span><span style="color:#a0a1a7">不</span><span style="color:#a0a1a7">匹</span><span style="color:#a0a1a7">配</span><span style="color:#a0a1a7">时</span><span style="color:#a0a1a7">执</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">代</span><span style="color:#a0a1a7">码</span>
}
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> a = <span style="color:#986801">2</span>;

    <span style="color:#a626a4">switch</span> (a) {
    <span style="color:#a626a4">case</span> <span style="color:#986801">1</span>:
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;hello 1 \n&quot;</span>);
        <span style="color:#a626a4">break</span>;
    <span style="color:#a626a4">case</span> <span style="color:#986801">2</span>:
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;hello 2 \n&quot;</span>);
        <span style="color:#a626a4">break</span>;
    <span style="color:#a626a4">default</span>:
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;hello a = %d \n&quot;</span>, a);
    }
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
hello <span style="color:#986801">2</span>

Tips：
<span style="color:#986801">1</span>、每个<span style="color:#a626a4">case</span>块末尾都需要有<span style="color:#a626a4">break</span>语句，否则将继续执行后面的<span style="color:#a626a4">case</span>块，直到遇到<span style="color:#a626a4">break</span>或者<span style="color:#a626a4">switch</span>
结束。
<span style="color:#986801">2</span>、<span style="color:#a626a4">switch</span>条件不能是浮点数：
<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
<span style="color:#986801">1.</span>c: In function ‘main’:
<span style="color:#986801">1.</span>c:<span style="color:#986801">7</span>:<span style="color:#986801">13</span>: error: <span style="color:#a626a4">switch</span> quantity <span style="color:#a626a4">not</span> an integer
    <span style="color:#986801">7</span> |     <span style="color:#a626a4">switch</span> (<span style="color:#986801">1.1</span>) {
      |</code></pre>

##### 2.2.4.3 循环：do、while、for

<p>do-while循环是C语言中的一种循环结构，它的基本语法如下：</p>

<pre class="guide-code"><code><span style="color:#a626a4">while</span> (条件) {
    <span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">循</span><span style="color:#a0a1a7">环</span><span style="color:#a0a1a7">体</span>
}；

<span style="color:#a626a4">do</span> {
    <span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">循</span><span style="color:#a0a1a7">环</span><span style="color:#a0a1a7">体</span>
    <span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">这</span><span style="color:#a0a1a7">里</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">代</span><span style="color:#a0a1a7">码</span><span style="color:#a0a1a7">至</span><span style="color:#a0a1a7">少</span><span style="color:#a0a1a7">会</span><span style="color:#a0a1a7">执</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">一</span><span style="color:#a0a1a7">次</span>
} <span style="color:#a626a4">while</span> (条件);
<span style="color:#a626a4">do</span>-<span style="color:#a626a4">while</span>与<span style="color:#a626a4">while</span>循环不同的是，<span style="color:#a626a4">do</span>-<span style="color:#a626a4">while</span>循环会先执行一次循环体，然后检查条件，如果条件为
真，循环将继续执行，这确保循环体至少被执行一次。</code></pre>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>()
{
    <span style="color:#986801">int</span> number;
    <span style="color:#a626a4">do</span> {
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;please enter a positive number: &quot;</span>);
        <span style="color:#c18401">scanf</span>(<span style="color:#50a14f">&quot;%d&quot;</span>, &amp;number);

        <span style="color:#a626a4">if</span> (number &lt;= <span style="color:#986801">0</span>) {
            <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;ensure positive number entered \n&quot;</span>);
        }
    } <span style="color:#a626a4">while</span> (number &lt;= <span style="color:#986801">0</span>);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;positive number</span><span style="color:#50a14f">：</span><span style="color:#50a14f">%d\n&quot;</span>, number);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
please enter a positive number: <span style="color:#986801">1</span>
positive number：<span style="color:#986801">1</span></code></pre>

<p>for 也是另一种循环结构，它的基本语法如下：</p>

<pre class="guide-code"><code><span style="color:#a626a4">for</span> (初始化;  条件表达式 ; 条件更新) {
    <span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">循</span><span style="color:#a0a1a7">环</span><span style="color:#a0a1a7">体</span><span style="color:#a0a1a7"> -&gt;</span><span style="color:#a0a1a7">条</span><span style="color:#a0a1a7">件</span><span style="color:#a0a1a7">表</span><span style="color:#a0a1a7">达</span><span style="color:#a0a1a7">式</span><span style="color:#a0a1a7">为</span><span style="color:#a0a1a7">真</span><span style="color:#a0a1a7">时</span><span style="color:#a0a1a7">进</span><span style="color:#a0a1a7">来</span>
}

Tips：养成好的习惯，条件的更新不要在循环体里进行更新，容易出现死循环</code></pre>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>()
{
    <span style="color:#a626a4">for</span> (<span style="color:#986801">int</span> i = <span style="color:#986801">0</span>; i &lt; <span style="color:#986801">5</span>; i++) {
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;i = %d \n&quot;</span>, i);
    }
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
i = <span style="color:#986801">0</span>
i = <span style="color:#986801">1</span>
i = <span style="color:#986801">2</span>
i = <span style="color:#986801">3</span>
i = <span style="color:#986801">4</span></code></pre>

<p>do-while 和 for 怎么选</p>

<p>一般是：某个条件不满足时退出循环，用do-while或者while，而靠计数结束退出循环，用for。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">void</span> <span style="color:#4078f2">main</span>()
{
    <span style="color:#a626a4">while</span>(<span style="color:#986801">1</span>) {

    }

    <span style="color:#a626a4">for</span>(;;) {

    }
}

单片机中有两种死循环的写法？你一般用哪种？
(不用纠结，用哪种都可以，基本没有什么区别)</code></pre>

##### 2.2.4.4 跳转：continue、break、return、goto

<p>continue、break一般结合循环来用：continue 跳过以下的循环体，进行下一轮循环，break 提前结束循环。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>()
{
    <span style="color:#a626a4">for</span> (<span style="color:#986801">int</span> i = <span style="color:#986801">0</span>; i &lt; <span style="color:#986801">5</span>; i++) {
        <span style="color:#a626a4">if</span> (i == <span style="color:#986801">1</span>) {
           <span style="color:#a626a4">continue</span>;
        } <span style="color:#a626a4">else</span> <span style="color:#a626a4">if</span> (i == <span style="color:#986801">4</span>) {
           <span style="color:#a626a4">break</span>;
        }
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;i = %d \n&quot;</span>, i);
    }
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}
<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
i = <span style="color:#986801">0</span>
<span style="color:#a0a1a7">//i = 1 </span><span style="color:#a0a1a7">不</span><span style="color:#a0a1a7">打</span><span style="color:#a0a1a7">印</span><span style="color:#a0a1a7">是</span><span style="color:#a0a1a7">因</span><span style="color:#a0a1a7">为</span><span style="color:#a0a1a7">continue</span><span style="color:#a0a1a7">跳</span><span style="color:#a0a1a7">过</span><span style="color:#a0a1a7">了</span>
i = <span style="color:#986801">2</span>
i = <span style="color:#986801">3</span>
<span style="color:#a0a1a7">//i = 4 </span><span style="color:#a0a1a7">不</span><span style="color:#a0a1a7">打</span><span style="color:#a0a1a7">印</span><span style="color:#a0a1a7">是</span><span style="color:#a0a1a7">因</span><span style="color:#a0a1a7">为</span><span style="color:#a0a1a7">break</span><span style="color:#a0a1a7">直</span><span style="color:#a0a1a7">接</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">束</span><span style="color:#a0a1a7">循</span><span style="color:#a0a1a7">环</span><span style="color:#a0a1a7">了</span></code></pre>

<p>return 结束本次的函数执行，至多可带一个数值返回。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">func</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#a626a4">for</span> (<span style="color:#986801">int</span> i = <span style="color:#986801">0</span>; i &lt; <span style="color:#986801">5</span>; i++) {
        <span style="color:#a626a4">if</span> (i == <span style="color:#986801">4</span>) {
           <span style="color:#a626a4">return</span> i;
        }
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;i = %d \n&quot;</span>, i);
    }
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;func end\n&quot;</span>);
}

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>()
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;value:%d of func return \n&quot;</span>, <span style="color:#c18401">func</span>());

    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}
<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
i = <span style="color:#986801">0</span>
i = <span style="color:#986801">1</span>
i = <span style="color:#986801">2</span>
i = <span style="color:#986801">3</span>
<span style="color:#a0a1a7">//i = 4 </span><span style="color:#a0a1a7">和</span><span style="color:#a0a1a7"> func end </span><span style="color:#a0a1a7">不</span><span style="color:#a0a1a7">打</span><span style="color:#a0a1a7">印</span><span style="color:#a0a1a7">是</span><span style="color:#a0a1a7">因</span><span style="color:#a0a1a7">为</span><span style="color:#a0a1a7">return</span><span style="color:#a0a1a7">直</span><span style="color:#a0a1a7">接</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">束</span><span style="color:#a0a1a7">了</span><span style="color:#a0a1a7">func</span>

value:<span style="color:#986801">4</span> of func <span style="color:#a626a4">return</span></code></pre>

<p>goto：直接跳转到对于label位置执行。尽管在许多编程风格中，使用goto被视为不推荐的实践，因为它可能导致代码不易理解和维护，但有时候它可以用于一些特殊的控制流需求（linux的源码中有大量的使用）。建议是在同一个函数内用，不要在不同函数直接跳，程序会把你逼疯的。它的基本语法如下：</p>

<pre class="guide-code"><code><span style="color:#a626a4">goto</span> label;

<span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">在</span><span style="color:#a0a1a7">标</span><span style="color:#a0a1a7">签</span><span style="color:#a0a1a7">位</span><span style="color:#a0a1a7">置</span><span style="color:#a0a1a7">定</span><span style="color:#a0a1a7">义</span><span style="color:#a0a1a7">代</span><span style="color:#a0a1a7">码</span><span style="color:#a0a1a7">块</span>
label:
    <span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">代</span><span style="color:#a0a1a7">码</span><span style="color:#a0a1a7">块</span></code></pre>

<pre class="guide-code"><code><span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">体会</span><span style="color:#a0a1a7">linux</span><span style="color:#a0a1a7">驱</span><span style="color:#a0a1a7">动</span><span style="color:#a0a1a7">中</span><span style="color:#a0a1a7">常</span><span style="color:#a0a1a7">用</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">goto</span><span style="color:#a0a1a7">案</span><span style="color:#a0a1a7">例</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdlib.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>()
{
    <span style="color:#986801">int</span> *p1;
    <span style="color:#986801">int</span> *p2;
    <span style="color:#986801">int</span> *p3;

    p1 = (<span style="color:#986801">int</span>*)<span style="color:#c18401">malloc</span>(<span style="color:#c18401">sizeof</span>(<span style="color:#986801">int</span>));
    <span style="color:#a626a4">if</span> (!p1) {
        <span style="color:#a626a4">return</span> <span style="color:#986801">-1</span>;
    }
    p2 = (<span style="color:#986801">int</span>*)<span style="color:#c18401">malloc</span>(<span style="color:#c18401">sizeof</span>(<span style="color:#986801">int</span>));
    <span style="color:#a626a4">if</span> (!p2) {
        <span style="color:#a626a4">goto</span> fail_1;
    }
    p3 = (<span style="color:#986801">int</span>*)<span style="color:#c18401">malloc</span>(<span style="color:#c18401">sizeof</span>(<span style="color:#986801">int</span>));
    <span style="color:#a626a4">if</span> (!p3) {
        <span style="color:#a626a4">goto</span> fail_2;
    }

    <span style="color:#c18401">free</span>(p3);
fail_2:
    <span style="color:#c18401">free</span>(p2);
fail_1:
    <span style="color:#c18401">free</span>(p1);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}
Tips：建议是在一个函数也只往一个方向上<span style="color:#a626a4">goto</span>，不要往回跳，代码阅读性很差也很容易死循环。</code></pre>

### 2.3 运算符

<p>程序的本质是逻辑和数据。狭义上运算是指是数学运算，广义的运算是数据处理。在C语言中运算符分为：算数运算、逻辑预算、位运算、赋值更新、内存访问。这里提一个理念：对于运算符的优先级问题，不建议死记硬背，用()万能钥匙来人为定义优先级。不要吝啬用()，()会让你的程序变得清晰可读。</p>

#### 2.3.1 算数运算

##### 2.3.1.1 加减乘除：+、-、*、/

<p>加减乘除大家从小学就开始学了，所以非常容易理解。这里提一个观念就是：对于CPU来讲，加减法的运行速率比乘除要快。这是因为CPU进行运算主要依赖于算术逻辑单元（ALU）和浮点运算单元（FPU），而ALU的本质是累加器，所以加减法在硬件处理就很快，乘除法有时候编译器会转换成加减法或者移位操作。随着计算机的发展，现在已经有了&quot;乘法器&quot;的硬件支持，速度上也已经很快。我们感受一下编译器对乘除法的优化：</p>

<p>直接调用&quot;乘法器&quot;进行运算</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>()
{
    <span style="color:#986801">int</span> a = <span style="color:#986801">10</span>;
    <span style="color:#986801">int</span> b = a * <span style="color:#986801">34</span>;

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;b = %d \n&quot;</span>, b);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}
<span style="color:#a0a1a7">//    int a = 10;</span>
<span style="color:#a0a1a7">//    int b = a * 33;</span>
movl    $<span style="color:#986801">10</span>, <span style="color:#986801">-8</span>(%rbp)
movl    <span style="color:#986801">-8</span>(%rbp), %eax
<span style="color:#d83931">imull   $34, %eax, %eax</span>
movl    %eax, <span style="color:#986801">-4</span>(%rbp)</code></pre>

<p>乘法转换成向左移位和加法运算</p>

<pre class="guide-code"><code><span style="color:#986801">int</span> <span style="color:#4078f2">main</span>()
{
    <span style="color:#986801">int</span> a = <span style="color:#986801">10</span>;
    <span style="color:#986801">int</span> b = a * <span style="color:#986801">33</span>;

    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#a0a1a7">//    int a = 10;</span>
<span style="color:#a0a1a7">//    int b = a * 33;</span>
movl    $<span style="color:#986801">10</span>, <span style="color:#986801">-8</span>(%rbp)
movl    <span style="color:#986801">-8</span>(%rbp), %edx
movl    %edx, %eax
<span style="color:#d83931">sall    $5, %eax</span>
<span style="color:#d83931">addl    %edx, %eax</span>
movl    %eax, <span style="color:#986801">-4</span>(%rbp)
movl    $<span style="color:#986801">0</span>, %eax</code></pre>

<p>除法转换成向右移位运算</p>

<pre class="guide-code"><code><span style="color:#986801">int</span> <span style="color:#4078f2">main</span>()
{
    <span style="color:#986801">int</span> a = <span style="color:#986801">100</span>;
    <span style="color:#986801">int</span> b = a / <span style="color:#986801">32</span>;

    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#a0a1a7">//    int a = 100;</span>
<span style="color:#a0a1a7">//    int b = a / 32;</span>
movl    $<span style="color:#986801">100</span>, <span style="color:#986801">-8</span>(%rbp)
movl    <span style="color:#986801">-8</span>(%rbp), %eax
<span style="color:#d83931">sarl    $5, %eax</span>
movl    %eax, <span style="color:#986801">-4</span>(%rbp)</code></pre>

##### 2.3.1.2 mod操作：%

<p>%运算我们也称为mod运算，表示取余数。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>()
{
    <span style="color:#986801">int</span> a = <span style="color:#986801">10</span>;

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a mod 3 = %d \n&quot;</span>, a % <span style="color:#986801">3</span>);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
a mod <span style="color:#986801">3</span> = <span style="color:#986801">1</span></code></pre>

<p>循环队列的索引更新</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> LEN 10</span>
<span style="color:#986801">int</span> buff[LEN]；
<span style="color:#986801">int</span> index = <span style="color:#986801">0</span>；

<span style="color:#986801">void</span> <span style="color:#c18401">data_process</span>(<span style="color:#986801">int</span> data)
{
    index = index % LEN;
    buff[index] = data;
    index++;
}</code></pre>

<p>生成[L, R]区间内的随机数</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdlib.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;malloc.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;time.h&gt;</span>

<span style="color:#986801">int</span>* <span style="color:#4078f2">generate_array</span>(<span style="color:#986801">int</span> n, <span style="color:#986801">int</span> L, <span style="color:#986801">int</span> R)
{
    <span style="color:#986801">int</span>* array = (<span style="color:#986801">int</span>*)<span style="color:#c18401">malloc</span>(<span style="color:#c18401">sizeof</span>(<span style="color:#986801">int</span>) * n);
    <span style="color:#c18401">srand</span>(<span style="color:#c18401">time</span>(<span style="color:#0184bb">NULL</span>));
    <span style="color:#a626a4">for</span> (<span style="color:#986801">int</span> i = <span style="color:#986801">0</span>; i &lt; n; i++) {
        array[i] = <span style="color:#c18401">rand</span>() % (R - L + <span style="color:#986801">1</span>) + L;
    }
    <span style="color:#a626a4">return</span> array;
}

<span style="color:#986801">void</span> <span style="color:#4078f2">print_array</span>(<span style="color:#986801">int</span>* data, <span style="color:#986801">int</span> n)
{
    <span style="color:#a626a4">for</span> (<span style="color:#986801">int</span> i = <span style="color:#986801">0</span>; i &lt; n; i++) {
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%d &quot;</span>, data[i]);
    }
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;\n&quot;</span>);
}
<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>()
{
    <span style="color:#986801">int</span> *arr = <span style="color:#c18401">generate_array</span>(<span style="color:#986801">10</span>, <span style="color:#986801">0</span>, <span style="color:#986801">10</span>);
    <span style="color:#c18401">print_array</span>(arr, <span style="color:#986801">10</span>);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}
<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span>
<span style="color:#986801">0</span> <span style="color:#986801">4</span> <span style="color:#986801">7</span> <span style="color:#986801">0</span> <span style="color:#986801">8</span> <span style="color:#986801">6</span> <span style="color:#986801">1</span> <span style="color:#986801">10</span> <span style="color:#986801">3</span> <span style="color:#986801">5</span></code></pre>

<p>%还可以做占位符号，在格式转换时用</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>()
{
    <span style="color:#986801">int</span> a = <span style="color:#986801">10</span>;

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a = %d %x %o \n&quot;</span>, a, a, a)
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}</code></pre>

#### 2.3.2 位运算

##### 2.3.2.1 移位：<< 、>>

<p>&lt;&lt; 左移：在没有溢出之前，每移动一位等价于乘于2，且移位后右边补0；</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> CALCULATE_LEN(a) (sizeof(a)*8)</span>
<span style="color:#a0a1a7">//%d %x %o </span>
<span style="color:#986801">void</span> <span style="color:#4078f2">print_binary</span>(<span style="color:#986801">long</span> <span style="color:#986801">long</span> a, <span style="color:#986801">int</span> n)
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;: &quot;</span>);
    <span style="color:#a626a4">while</span> (n--) {
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%lld &quot;</span>, (a &gt;&gt; n) &amp; <span style="color:#986801">0x01</span>);
    }
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;: %lld \n&quot;</span>, a);
}

<span style="color:#986801">void</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">char</span> a = <span style="color:#986801">1</span>;
    <span style="color:#a626a4">for</span> (<span style="color:#986801">int</span> i = <span style="color:#986801">0</span>; i &lt; <span style="color:#986801">8</span>; i++) {
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%d left shift %d &quot;</span>,a, i);
        <span style="color:#c18401">print_binary</span>(a &lt;&lt; i, <span style="color:#c18401">CALCULATE_LEN</span>(a));
    }
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span>
a = <span style="color:#986801">1</span>, left shift <span style="color:#986801">0</span> : <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">1</span> : <span style="color:#986801">1</span> <span style="color:#a0a1a7">// 1 &lt;&lt; 0</span>
a = <span style="color:#986801">1</span>, left shift <span style="color:#986801">1</span> : <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">1</span> <span style="color:#986801">0</span> : <span style="color:#986801">2</span> <span style="color:#a0a1a7">// 1 &lt;&lt; 1</span>
a = <span style="color:#986801">1</span>, left shift <span style="color:#986801">2</span> : <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">1</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> : <span style="color:#986801">4</span> <span style="color:#a0a1a7">// 1 &lt;&lt; 2</span>
a = <span style="color:#986801">1</span>, left shift <span style="color:#986801">3</span> : <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">1</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> : <span style="color:#986801">8</span> <span style="color:#a0a1a7">// 1 &lt;&lt; 3</span>
a = <span style="color:#986801">1</span>, left shift <span style="color:#986801">4</span> : <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">1</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> : <span style="color:#986801">16</span>
a = <span style="color:#986801">1</span>, left shift <span style="color:#986801">5</span> : <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">1</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> : <span style="color:#986801">32</span>
a = <span style="color:#986801">1</span>, left shift <span style="color:#986801">6</span> : <span style="color:#986801">0</span> <span style="color:#986801">1</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> : <span style="color:#986801">64</span>
a = <span style="color:#986801">1</span>, left shift <span style="color:#986801">7</span> : <span style="color:#986801">1</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> : <span style="color:#986801">128</span>
a = <span style="color:#986801">1</span>, left shift <span style="color:#986801">8</span> : <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> : <span style="color:#986801">0</span>  <span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">因</span><span style="color:#a0a1a7">为</span><span style="color:#a0a1a7">a</span><span style="color:#a0a1a7">为</span><span style="color:#a0a1a7">char</span><span style="color:#a0a1a7">类</span><span style="color:#a0a1a7">型</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">左</span><span style="color:#a0a1a7">移</span><span style="color:#a0a1a7">8</span><span style="color:#a0a1a7">位</span><span style="color:#a0a1a7">后</span><span style="color:#a0a1a7">溢</span><span style="color:#a0a1a7">出</span><span style="color:#a0a1a7">了</span></code></pre>

<p>&gt;&gt; 右移：每移动一位等价于除于2。signed类型和unsigned在右移的时候有差别：如果是负数，移位后补1，正数补0，<span style="color:#d83931">所</span><span style="color:#d83931">以</span><span style="color:#d83931">负</span><span style="color:#d83931">数</span><span style="color:#d83931">通过</span><span style="color:#d83931">右</span><span style="color:#d83931">移</span><span style="color:#d83931">永</span><span style="color:#d83931">远</span><span style="color:#d83931">都</span><span style="color:#d83931">不</span><span style="color:#d83931">会</span><span style="color:#d83931">等</span><span style="color:#d83931">于</span><span style="color:#d83931">0</span>：</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> CALCULATE_LEN(a) (sizeof(a)*8)</span>

<span style="color:#986801">void</span> <span style="color:#4078f2">print_binary</span>(<span style="color:#986801">char</span> a, <span style="color:#986801">int</span> n)
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;: &quot;</span>);
    <span style="color:#a626a4">while</span> (n--) {
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%d &quot;</span>, (a &gt;&gt; n) &amp; <span style="color:#986801">0x01</span>);
    }
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;: %d \n&quot;</span>, a);
}

<span style="color:#986801">void</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">char</span> a = <span style="color:#986801">0x80</span>;

    <span style="color:#a626a4">for</span> (<span style="color:#986801">int</span> i = <span style="color:#986801">0</span>; i &lt; <span style="color:#986801">9</span>; i++) {
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a = 0x%x, right shift %d times&quot;</span>,a &amp; <span style="color:#986801">0xFF</span>, i);
        <span style="color:#c18401">print_binary</span>((a &gt;&gt; i), <span style="color:#c18401">CALCULATE_LEN</span>(a));
    }
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span><span style="color:#646a73">：</span><span style="color:#646a73">a </span><span style="color:#646a73">为</span><span style="color:#646a73"> char</span><span style="color:#646a73">类</span><span style="color:#646a73">型</span><span style="color:#646a73"> a = -1</span>
a = <span style="color:#986801">0x80</span>, right shift <span style="color:#986801">0</span> times: <span style="color:#986801">1</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> : <span style="color:#986801">-128</span>
a = <span style="color:#986801">0x80</span>, right shift <span style="color:#986801">1</span> times: <span style="color:#986801">1</span> <span style="color:#986801">1</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> : <span style="color:#986801">-64</span>
a = <span style="color:#986801">0x80</span>, right shift <span style="color:#986801">2</span> times: <span style="color:#986801">1</span> <span style="color:#986801">1</span> <span style="color:#986801">1</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> : <span style="color:#986801">-32</span>
a = <span style="color:#986801">0x80</span>, right shift <span style="color:#986801">3</span> times: <span style="color:#986801">1</span> <span style="color:#986801">1</span> <span style="color:#986801">1</span> <span style="color:#986801">1</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> : <span style="color:#986801">-16</span>
a = <span style="color:#986801">0x80</span>, right shift <span style="color:#986801">4</span> times: <span style="color:#986801">1</span> <span style="color:#986801">1</span> <span style="color:#986801">1</span> <span style="color:#986801">1</span> <span style="color:#986801">1</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> : <span style="color:#986801">-8</span>
a = <span style="color:#986801">0x80</span>, right shift <span style="color:#986801">5</span> times: <span style="color:#986801">1</span> <span style="color:#986801">1</span> <span style="color:#986801">1</span> <span style="color:#986801">1</span> <span style="color:#986801">1</span> <span style="color:#986801">1</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> : <span style="color:#986801">-4</span>
a = <span style="color:#986801">0x80</span>, right shift <span style="color:#986801">6</span> times: <span style="color:#986801">1</span> <span style="color:#986801">1</span> <span style="color:#986801">1</span> <span style="color:#986801">1</span> <span style="color:#986801">1</span> <span style="color:#986801">1</span> <span style="color:#986801">1</span> <span style="color:#986801">0</span> : <span style="color:#986801">-2</span>
a = <span style="color:#986801">0x80</span>, right shift <span style="color:#986801">7</span> times: <span style="color:#986801">1</span> <span style="color:#986801">1</span> <span style="color:#986801">1</span> <span style="color:#986801">1</span> <span style="color:#986801">1</span> <span style="color:#986801">1</span> <span style="color:#986801">1</span> <span style="color:#986801">1</span> : <span style="color:#986801">-1</span> <span style="color:#d83931"> </span>
a = <span style="color:#986801">0x80</span>, right shift <span style="color:#986801">8</span> times: <span style="color:#d83931">1 1 1 1 1 1 1 1 : -1</span>

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span><span style="color:#646a73">：</span><span style="color:#646a73">a </span><span style="color:#646a73">为</span><span style="color:#646a73"> unsigned char</span><span style="color:#646a73">类</span><span style="color:#646a73">型</span><span style="color:#646a73"> a = 128</span>
a = <span style="color:#986801">0x80</span>, right shift <span style="color:#986801">0</span> times: <span style="color:#986801">1</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> : <span style="color:#986801">128</span>
a = <span style="color:#986801">0x80</span>, right shift <span style="color:#986801">1</span> times: <span style="color:#986801">0</span> <span style="color:#986801">1</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> : <span style="color:#986801">64</span>
a = <span style="color:#986801">0x80</span>, right shift <span style="color:#986801">2</span> times: <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">1</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> : <span style="color:#986801">32</span>
a = <span style="color:#986801">0x80</span>, right shift <span style="color:#986801">3</span> times: <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">1</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> : <span style="color:#986801">16</span>
a = <span style="color:#986801">0x80</span>, right shift <span style="color:#986801">4</span> times: <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">1</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> : <span style="color:#986801">8</span>
a = <span style="color:#986801">0x80</span>, right shift <span style="color:#986801">5</span> times: <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">1</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> : <span style="color:#986801">4</span>
a = <span style="color:#986801">0x80</span>, right shift <span style="color:#986801">6</span> times: <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">1</span> <span style="color:#986801">0</span> : <span style="color:#986801">2</span>
a = <span style="color:#986801">0x80</span>, right shift <span style="color:#986801">7</span> times: <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">1</span> : <span style="color:#986801">1</span>
a = <span style="color:#986801">0x80</span>, right shift <span style="color:#986801">8</span> times: <span style="color:#2ea121">0 0 0 0 0 0 0 0 : 0</span></code></pre>

##### 2.3.2.2 位与或、取反：& 、| 、~

<p>我们知道操作硬件的最小能力是bit位，所以按位与&quot;&amp;&quot; 、按位或&quot;|&quot;、按位取反&quot;~&quot; 在嵌入式的寄存器操作中运用非常广泛。下面是基本规则：</p>

<pre class="guide-code"><code>|: 1 | 1 = 1； 1 | 0 = 1； 0 | 1 = 1； <span style="color:#986801">0</span> | <span style="color:#986801">0</span> = <span style="color:#986801">0</span>  -&gt; 俗称 置位器（set）
&amp;: <span style="color:#986801">1</span> &amp; <span style="color:#986801">1</span> = <span style="color:#986801">1</span>； 1 &amp; 0 = 0； 0 &amp; 1 = 0； 0 &amp; 0 = 0  -&gt; 俗称 清零器（clr）
~：~(<span style="color:#986801">0x80</span>) = <span style="color:#986801">0x7F</span>  -&gt; 按位取反 0b10000000 ~ 0b01111111</code></pre>

<p>置位: |</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> CALCULATE_LEN(a) (sizeof(a)*8)</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> SET(reg, n) ((reg) |= 0x1&lt;&lt;(n))</span>

<span style="color:#986801">void</span> <span style="color:#4078f2">print_binary</span>(<span style="color:#986801">unsigned</span> <span style="color:#986801">char</span> a, <span style="color:#986801">int</span> n)
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;: &quot;</span>);
    <span style="color:#a626a4">while</span> (n--) {
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%d &quot;</span>, (a &gt;&gt; n) &amp; <span style="color:#986801">0x01</span>);
    }
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;: %d \n&quot;</span>, a);
}

<span style="color:#986801">void</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">unsigned</span> <span style="color:#986801">char</span> a = <span style="color:#986801">0x01</span>;

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a&quot;</span>);
    <span style="color:#c18401">print_binary</span>(a, <span style="color:#c18401">CALCULATE_LEN</span>(a));

    <span style="color:#a0a1a7">//a = a | 0x80;</span>
    <span style="color:#a0a1a7">//a =  a | 0x1 &lt;&lt; 7;</span>
    <span style="color:#c18401">SET</span>(a, <span style="color:#986801">7</span>);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a&quot;</span>);
    <span style="color:#c18401">print_binary</span>(a, <span style="color:#c18401">CALCULATE_LEN</span>(a));
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span><span style="color:#646a73">：</span>
a: <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">1</span> : <span style="color:#986801">1</span>
a: <span style="color:#986801">1</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">1</span> : <span style="color:#986801">129</span></code></pre>

<p>清零:  &amp; 和 ~ 一起用</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> CALCULATE_LEN(a) (sizeof(a)*8)</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> CLR(reg, n) ((reg) &amp;= ~(0x1&lt;&lt;(n)))</span>

<span style="color:#986801">void</span> <span style="color:#4078f2">print_binary</span>(<span style="color:#986801">unsigned</span> <span style="color:#986801">char</span> a, <span style="color:#986801">int</span> n)
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;: &quot;</span>);
    <span style="color:#a626a4">while</span> (n--) {
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%d &quot;</span>, (a &gt;&gt; n) &amp; <span style="color:#986801">0x01</span>);
    }
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;: %d \n&quot;</span>, a);
}

<span style="color:#986801">void</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">unsigned</span> <span style="color:#986801">char</span> a = <span style="color:#986801">0x81</span>;

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a&quot;</span>);
    <span style="color:#c18401">print_binary</span>(a, <span style="color:#c18401">CALCULATE_LEN</span>(a));

    <span style="color:#a0a1a7">//a = a &amp; 0x7F;</span>
    <span style="color:#a0a1a7">//a =  a &amp; ~(0x1&lt;&lt;7);</span>
    <span style="color:#c18401">CLR</span>(a, <span style="color:#986801">7</span>);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a&quot;</span>);
    <span style="color:#c18401">print_binary</span>(a, <span style="color:#c18401">CALCULATE_LEN</span>(a));
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span><span style="color:#646a73">：</span>
a: <span style="color:#986801">1</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">1</span> : <span style="color:#986801">129</span>
a: <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">0</span> <span style="color:#986801">1</span> : <span style="color:#986801">1</span></code></pre>

##### 2.3.2.3 位异或：^

<p>按位异或&quot;^&quot;在嵌入中运用相对较少，一般用于算法中，如加密算法。下面是基本规则：</p>

<pre class="guide-code"><code>^: <span style="color:#de7802">1 ^ 1 = 0</span><span style="color:#de7802">；</span><span style="color:#de7802"> 1 ^ 0 = 1</span><span style="color:#de7802">；</span><span style="color:#de7802"> 0 ^ 1 = 1</span><span style="color:#de7802">；</span><span style="color:#de7802"> 0 ^ 0 = 0 -&gt; </span><span style="color:#de7802">当</span><span style="color:#de7802">相</span><span style="color:#de7802">同</span><span style="color:#de7802">的</span><span style="color:#de7802">时</span><span style="color:#de7802">候</span><span style="color:#de7802">为</span><span style="color:#de7802">0</span><span style="color:#de7802">，</span><span style="color:#de7802">不</span><span style="color:#de7802">相</span><span style="color:#de7802">同</span><span style="color:#de7802">的</span><span style="color:#de7802">时</span><span style="color:#de7802">候</span><span style="color:#de7802">为</span><span style="color:#de7802">1</span></code></pre>

<pre class="guide-code"><code><span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">不</span><span style="color:#a0a1a7">需</span><span style="color:#a0a1a7">要</span><span style="color:#a0a1a7">用</span><span style="color:#a0a1a7">第</span><span style="color:#a0a1a7">三个</span><span style="color:#a0a1a7">变</span><span style="color:#a0a1a7">量</span><span style="color:#a0a1a7">就</span><span style="color:#a0a1a7">可</span><span style="color:#a0a1a7">以</span><span style="color:#a0a1a7">实</span><span style="color:#a0a1a7">现</span><span style="color:#a0a1a7">两个</span><span style="color:#a0a1a7">变</span><span style="color:#a0a1a7">量</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">值</span><span style="color:#a0a1a7">交</span><span style="color:#a0a1a7">换</span>

<span style="color:#986801">void</span> <span style="color:#4078f2">swap</span>(<span style="color:#986801">int</span>* a, <span style="color:#986801">int</span>* b)
{
    <span style="color:#a626a4">if</span> ((*a) == (*b)) {
        <span style="color:#a626a4">return</span>;
    }

    *a = (*a) ^ (*b);
    *b = (*a) ^ (*b);
    *a = (*a) ^ (*b);
}

Tips：这个方法的优势在于不需要额外的空间，并且没有溢出的风险。需要注意的是，该方法在处理相
同的数值时会导致结果为零。在实际应用中，要考虑这一点</code></pre>

#### 2.3.3 逻辑运算

<p>逻辑运算的结果只有真假，即1和0。</p>

##### 2.3.3.1 条件或与：||、&&

<pre class="guide-code"><code>A &amp;&amp; B （与运算，都为真才为真）
<span style="color:#d83931">Tips</span><span style="color:#d83931">：</span><span style="color:#d83931">只</span><span style="color:#d83931">要</span><span style="color:#d83931">A</span><span style="color:#d83931">为</span><span style="color:#d83931">假</span><span style="color:#d83931">，</span><span style="color:#d83931">则</span><span style="color:#d83931">B</span><span style="color:#d83931">不</span><span style="color:#d83931">会</span><span style="color:#d83931">被</span><span style="color:#d83931">执</span><span style="color:#d83931">行</span>
A || B （或运算，一个为真就为真）
<span style="color:#d83931">Tips</span><span style="color:#d83931">：</span><span style="color:#d83931">只</span><span style="color:#d83931">要</span><span style="color:#d83931">A</span><span style="color:#d83931">为</span><span style="color:#d83931">真</span><span style="color:#d83931">，</span><span style="color:#d83931">则</span><span style="color:#d83931">B</span><span style="color:#d83931">不</span><span style="color:#d83931">会</span><span style="color:#d83931">被</span><span style="color:#d83931">执</span><span style="color:#d83931">行</span></code></pre>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">func1</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;func1 call \n&quot;</span>);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}
<span style="color:#986801">int</span> <span style="color:#4078f2">func2</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;func2 call \n&quot;</span>);
    <span style="color:#a626a4">return</span> <span style="color:#986801">10</span>;
}
<span style="color:#986801">void</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;---------1--------\n&quot;</span>);
    <span style="color:#a626a4">if</span> (<span style="color:#c18401">func1</span>() &amp;&amp; <span style="color:#c18401">func2</span>()) {
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;do something  \n&quot;</span>);
    }

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;---------2--------\n&quot;</span>);
    <span style="color:#a626a4">if</span> (<span style="color:#c18401">func2</span>() &amp;&amp; <span style="color:#c18401">func1</span>()) {
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;do something  \n&quot;</span>);
    }

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;---------3--------\n&quot;</span>);
    <span style="color:#a626a4">if</span> (<span style="color:#c18401">func1</span>() || <span style="color:#c18401">func2</span>()) {
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;do something  \n&quot;</span>);
    }

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;---------4--------\n&quot;</span>);
    <span style="color:#a626a4">if</span> (<span style="color:#c18401">func2</span>() || <span style="color:#c18401">func1</span>()) {
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;do something  \n&quot;</span>);
    }
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span><span style="color:#646a73">：</span>
--------<span style="color:#986801">-1</span>--------
func1 call
--------<span style="color:#986801">-2</span>--------
func2 call
func1 call
--------<span style="color:#986801">-3</span>--------
func1 call
func2 call
<span style="color:#a626a4">do</span> something
--------<span style="color:#986801">-4</span>--------
func2 call
<span style="color:#a626a4">do</span> something</code></pre>

##### 2.3.3.2 大小判断：== 、>、<、>=、<=、? :

<pre class="guide-code"><code>Tips1：== 因为 = 在使用上容易混淆。建议使用==时，把数字放在左边，变量放在右边，这样如果写
成=编译器就会报错拦截出来。
<span style="color:#a626a4">if</span> (<span style="color:#986801">10</span> == a) {
    ...
}

Tips2：A ? B : C 等价于
<span style="color:#a626a4">if</span> (A) {
    B;
} <span style="color:#a626a4">else</span> {
    C;
}</code></pre>

##### 2.3.3.3 条件取反：！

<pre class="guide-code"><code>Tips1：常用于指针空判断
<span style="color:#986801">int</span> *p = (<span style="color:#986801">int</span>*)<span style="color:#c18401">malloc</span>(<span style="color:#c18401">sizeof</span>(<span style="color:#986801">int</span>));
<span style="color:#a626a4">if</span> (!p) {
    <span style="color:#a0a1a7">//do something</span>
}

Tips2：用于二值化处理
<span style="color:#986801">int</span> a = xx；
<span style="color:#986801">unsigned</span> <span style="color:#986801">char</span> b = <span style="color:#986801">0</span>;

b = !!a； --&gt;不管a的值是多少，b只有<span style="color:#986801">0</span>和<span style="color:#986801">1</span></code></pre>

#### 2.3.4 赋值更新：=、 += 、-=、&=、|=，++、 --

<p>赋值更新的本质是：通过标签（变量名）改变内存里面的值。</p>

<pre class="guide-code"><code><span style="color:#986801">int</span> a；
a = <span style="color:#986801">10</span>；
a += <span style="color:#986801">1</span>; <span style="color:#a0a1a7">//-&gt; a = a + 1</span>
a -= <span style="color:#986801">1</span>; <span style="color:#a0a1a7">//-&gt; a = a - 1</span>
a &amp;= <span style="color:#986801">1</span>; <span style="color:#a0a1a7">//-&gt; a = a &amp; 1</span>
a |= <span style="color:#986801">1</span>; <span style="color:#a0a1a7">//-&gt; a = a | 1</span>
a++;    <span style="color:#a0a1a7">//-&gt; a = a + 1</span>
a--;    <span style="color:#a0a1a7">//-&gt; a = a - 1</span>
*(<span style="color:#986801">int</span>*)<span style="color:#986801">0x12345678</span> = <span style="color:#986801">1</span>;

tips1:主要 a++ 和 ++a 的区别：

a = <span style="color:#986801">0</span>；
<span style="color:#a626a4">if</span> (a++) {<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">先</span><span style="color:#a0a1a7">用</span><span style="color:#a0a1a7">a</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">再</span><span style="color:#a0a1a7">++</span>
    <span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">不</span><span style="color:#a0a1a7">执</span><span style="color:#a0a1a7">行</span>
}

a = <span style="color:#986801">0</span>；
<span style="color:#a626a4">if</span> (++a) {<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">先</span><span style="color:#a0a1a7">++</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">再</span><span style="color:#a0a1a7">用</span><span style="color:#a0a1a7">a</span>
    <span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">执</span><span style="color:#a0a1a7">行</span>
}</code></pre>

#### 2.3.5 内存操作

##### 2.3.5.1 函数访问:  ()

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">func1</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> a = <span style="color:#986801">0</span>;

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;func1 call \n&quot;</span>);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#986801">void</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">func1</span>();
}

func1:
.LFB0:
    endbr64
<span style="color:#d83931">    pushq   %rbp</span>
<span style="color:#d83931">    movq    %rsp, %rbp</span>
<span style="color:#d83931">    subq    $16, %rsp //</span><span style="color:#d83931">开</span><span style="color:#d83931">辟</span><span style="color:#d83931">栈</span><span style="color:#d83931">空</span><span style="color:#d83931">间</span>
<span style="color:#d83931">    movl    $0, -4(%rbp) //</span><span style="color:#d83931">访</span><span style="color:#d83931">问</span><span style="color:#d83931">栈</span><span style="color:#d83931">内</span><span style="color:#d83931">存</span><span style="color:#d83931">中</span><span style="color:#d83931">的</span><span style="color:#d83931">变</span><span style="color:#d83931">量</span><span style="color:#d83931">a</span>
    ...
    ret

main:
.LFB1:
    ...
    <span style="color:#2ea121">call    func1 //</span><span style="color:#2ea121">调</span><span style="color:#2ea121">用</span><span style="color:#2ea121">函</span><span style="color:#2ea121">数</span>
    ...
    ret</code></pre>

##### 2.3.5.2 取值操作：[]、*、->、.

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#a626a4">struct</span> <span style="color:#4078f2">abc</span> {
    <span style="color:#986801">int</span> a;
    <span style="color:#986801">int</span> b;
    <span style="color:#986801">int</span> c;
};

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#a626a4">struct</span> <span style="color:#4078f2">abc</span> d = {
        .a = <span style="color:#986801">1</span>,
        .b = <span style="color:#986801">2</span>,
        .c = <span style="color:#986801">3</span>,
    };
    <span style="color:#a626a4">struct</span> <span style="color:#4078f2">abc</span> *p = &amp;d;
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%d %d %d \n&quot;</span>, d.a, d.b, d.c);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%d %d %d \n&quot;</span>, p-&gt;a, p-&gt;b, p-&gt;c);

    <span style="color:#986801">int</span> a[<span style="color:#986801">3</span>] = {<span style="color:#986801">1</span>,<span style="color:#986801">2</span>,<span style="color:#986801">3</span>};
    <span style="color:#986801">int</span> *p1 = a;
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%d %d %d \n&quot;</span>, a[<span style="color:#986801">0</span>], a[<span style="color:#986801">1</span>], a[<span style="color:#986801">2</span>]);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%d %d %d \n&quot;</span>, (*p1), (*(p1+<span style="color:#986801">1</span>)), (*(p1+<span style="color:#986801">2</span>)));

    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span><span style="color:#646a73">：</span>
<span style="color:#986801">1</span> <span style="color:#986801">2</span> <span style="color:#986801">3</span>
<span style="color:#986801">1</span> <span style="color:#986801">2</span> <span style="color:#986801">3</span>
<span style="color:#986801">1</span> <span style="color:#986801">2</span> <span style="color:#986801">3</span>
<span style="color:#986801">1</span> <span style="color:#986801">2</span> <span style="color:#986801">3</span></code></pre>

##### 2.3.5.3 取址操作：&

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">func1</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> a = <span style="color:#986801">0</span>;
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;addr of a is %p \n&quot;</span>, &amp;a);

    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

Tips: &amp; 还有位与的功能。
<span style="color:#986801">1</span>、&amp;左边有值就是位与：<span style="color:#986801">0x1</span> &amp; a
<span style="color:#986801">2</span>、&amp;左边没有值就是取变量地址，&amp;a</code></pre>

##### 2.3.5.4 内存打包：{}

<p>结构体、联合体、枚举、函数就是典型的通过{}进行打包</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#a626a4">struct</span> <span style="color:#4078f2">abc</span> {
    <span style="color:#986801">int</span> a;
    <span style="color:#986801">int</span> b;
    <span style="color:#986801">int</span> c;
}

<span style="color:#986801">void</span> <span style="color:#4078f2">func</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#a626a4">return</span>;
}</code></pre>

## 3. 函数视角

<p>希望大家养成一个好的编程&quot;洁癖&quot;：Don&#x27;t Repeat Yourself，不要写重复的代码。所以当别人问你函数有什么用时，你就可以这么回答他。C语言是一个面向过程的语言，即面向方法（函数）编程（C++/Java 是面向对象编程），所以理解和应用函数的重要性不言而喻。</p>

<pre class="guide-code"><code><span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">取</span><span style="color:#a0a1a7">绝</span><span style="color:#a0a1a7">对</span><span style="color:#a0a1a7">值</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">逻</span><span style="color:#a0a1a7">辑</span>
<span style="color:#a626a4">if</span> (a &lt; <span style="color:#986801">0</span>)
    a = -a;
<span style="color:#a626a4">else</span>
    a = a;

<span style="color:#986801">int</span> <span style="color:#4078f2">abs</span>(<span style="color:#986801">int</span> a)
{
    <span style="color:#a626a4">if</span> (a &lt; <span style="color:#986801">0</span>)
        a = -a;
    <span style="color:#a626a4">else</span>
        a = a;
    <span style="color:#a626a4">return</span> a;
}</code></pre>

### 3.1 函数的世界

<p>啥是函数？函数的英文是&quot;function&quot;，翻译过来就是功能。所以函数字面意思就是：封装一些逻辑，实现一个功能。举一个例子：</p>

![原文图解（第 90 页）](assets/figures/p090-31.png)

![原文图解（第 90 页）](assets/figures/p090-32.png)

#### 3.1.1 函数三大属性

<p>把上面那个例子进行抽象，就可以得到函数的三大属性：输入参数、返回值、函数名。</p>

<pre class="guide-code"><code><span style="color:#986801">1.</span> 函数名（地址）
<span style="color:#986801">2.</span> 输入参数 (可多个)
<span style="color:#986801">3.</span> 返回值（至多一个）

输出: 函数名: 输入
<span style="color:#986801">int</span> <span style="color:#4078f2">function</span>(<span style="color:#986801">int</span>，<span style="color:#986801">char</span>)
{
    xxx
}

Tips：编译器只要看到有这三到属性，就判定为函数（即使函数体是空的）</code></pre>

<p>函数名本质上是一个<span style="color:#d83931">地址</span><span style="color:#d83931">标</span><span style="color:#d83931">签</span>。如果知道函数的地址，就可以直接用() 调过去</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">function</span>(<span style="color:#986801">int</span> a, <span style="color:#986801">int</span> b)
{
    <span style="color:#a626a4">return</span> (a+b);
}

<span style="color:#986801">void</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">function</span>(<span style="color:#986801">1</span>, <span style="color:#986801">2</span>);
}

通过命令：objdump -d bin &gt; bin.s 进行反汇编得到：

0000000000001129 &lt;function&gt;:
    <span style="color:#986801">1129</span>:   f3 <span style="color:#986801">0f</span> <span style="color:#986801">1</span>e fa             endbr64
    <span style="color:#986801">112</span>d:   <span style="color:#986801">55</span>                      push   %rbp
    <span style="color:#986801">112</span>e:   <span style="color:#986801">48</span> <span style="color:#986801">89</span> e5                mov    %rsp,%rbp
    <span style="color:#986801">1131</span>:   <span style="color:#986801">89</span> <span style="color:#986801">7</span>d fc                mov    %edi,<span style="color:#986801">-0x4</span>(%rbp)
    <span style="color:#986801">1134</span>:   <span style="color:#986801">89</span> <span style="color:#986801">75</span> f8                mov    %esi,<span style="color:#986801">-0x8</span>(%rbp)
    <span style="color:#986801">1137</span>:   <span style="color:#986801">8b</span> <span style="color:#986801">55</span> fc                mov    <span style="color:#986801">-0x4</span>(%rbp),%edx
    <span style="color:#986801">113</span>a:   <span style="color:#986801">8b</span> <span style="color:#986801">45</span> f8                mov    <span style="color:#986801">-0x8</span>(%rbp),%eax
    <span style="color:#986801">113</span>d:   <span style="color:#986801">01</span> d0                   add    %edx,%eax
    <span style="color:#986801">113f</span>:   <span style="color:#986801">5</span>d                      pop    %rbp
    <span style="color:#986801">1140</span>:   c3                      retq

<span style="color:#986801">0000000000001141</span> &lt;main&gt;:
    <span style="color:#986801">1141</span>:   f3 <span style="color:#986801">0f</span> <span style="color:#986801">1</span>e fa             endbr64
    <span style="color:#986801">1145</span>:   <span style="color:#986801">55</span>                      push   %rbp
    <span style="color:#986801">1146</span>:   <span style="color:#986801">48</span> <span style="color:#986801">89</span> e5                mov    %rsp,%rbp
    <span style="color:#986801">1149</span>:   be <span style="color:#986801">02</span> <span style="color:#986801">00</span> <span style="color:#986801">00</span> <span style="color:#986801">00</span>          mov    $<span style="color:#986801">0x2</span>,%esi
    <span style="color:#986801">114</span>e:   bf <span style="color:#986801">01</span> <span style="color:#986801">00</span> <span style="color:#986801">00</span> <span style="color:#986801">00</span>          mov    $<span style="color:#986801">0x1</span>,%edi
    <span style="color:#986801">1153</span>:   e8 d1 ff ff ff          callq  1129 &lt;function&gt;
    <span style="color:#986801">1158</span>:   <span style="color:#986801">90</span>                      nop
    <span style="color:#986801">1159</span>:   <span style="color:#986801">5</span>d                      pop    %rbp
    <span style="color:#986801">115</span>a:   c3                      retq
    <span style="color:#986801">115b</span>:   <span style="color:#986801">0f</span> <span style="color:#986801">1f</span> <span style="color:#986801">44</span> <span style="color:#986801">00</span> <span style="color:#986801">00</span>          nopl   <span style="color:#986801">0x0</span>(%rax,%rax,<span style="color:#986801">1</span>)</code></pre>

<pre class="guide-code"><code><span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">函</span><span style="color:#a0a1a7">数</span><span style="color:#a0a1a7">名</span><span style="color:#a0a1a7">本</span><span style="color:#a0a1a7">质</span><span style="color:#a0a1a7">上</span><span style="color:#a0a1a7">是</span><span style="color:#a0a1a7">一个</span><span style="color:#a0a1a7">地址</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">体会</span><span style="color:#a0a1a7">下</span><span style="color:#a0a1a7">面</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">例</span><span style="color:#a0a1a7">子</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdlib.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;string.h&gt;</span>
<span style="color:#a0a1a7">//extern int printf (const char *__restrict __format, ...)</span>
<span style="color:#c18401">int</span> (*show)(<span style="color:#986801">const</span> <span style="color:#986801">char</span> *, ...);
<span style="color:#986801">void</span> <span style="color:#4078f2">func</span>(<span style="color:#986801">void</span>)
{
    show = printf;
    <span style="color:#c18401">show</span>(<span style="color:#50a14f">&quot;func call \n&quot;</span>);
}

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">func</span>();
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span><span style="color:#646a73">：</span>
func call</code></pre>

#### 3.1.2 参数传递

##### 3.1.2.1 参数传递的本质

<p>调用函数时，需要传入和返回参数。传入和返回的参数过程本质上是：<span style="color:#d83931">内</span><span style="color:#d83931">存</span><span style="color:#d83931">拷</span><span style="color:#d83931">贝</span><span style="color:#d83931">。</span>既然是拷贝，那一定存在两个对象：目的地（dest），源（src）。在C语言中，传入参数时，目的地叫<span style="color:#d83931">形</span><span style="color:#d83931">参</span>、源叫<span style="color:#d83931">实</span><span style="color:#d83931">参</span><span style="color:#d83931">；</span>返回参数时，目的地和源都叫返回值。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#986801">int</span> <span style="color:#4078f2">show</span>(<span style="color:#986801">int</span> a) <span style="color:#d83931">//a </span><span style="color:#d83931">是</span><span style="color:#d83931">形</span><span style="color:#d83931">参</span><span style="color:#d83931">，</span><span style="color:#d83931">传</span><span style="color:#d83931">递过</span><span style="color:#d83931">程</span><span style="color:#d83931">，</span><span style="color:#d83931">就</span><span style="color:#d83931">把</span><span style="color:#d83931">num</span><span style="color:#d83931">的</span><span style="color:#d83931">值</span><span style="color:#d83931">拷</span><span style="color:#d83931">贝</span><span style="color:#d83931">给</span><span style="color:#d83931">了</span><span style="color:#d83931">a</span>
<span style="color:#2ea121">{</span>
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%d \n&quot;</span>, a);
    a++;

    <span style="color:#a626a4">return</span> a;<span style="color:#646a73">//a</span><span style="color:#646a73">此</span><span style="color:#646a73">时是</span><span style="color:#646a73">返</span><span style="color:#646a73">回</span><span style="color:#646a73">值</span>
}

<span style="color:#986801">void</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> num = <span style="color:#986801">10086</span>;
    <span style="color:#986801">int</span> ret = <span style="color:#986801">0</span>;

    <span style="color:#d83931">//num </span><span style="color:#d83931">是</span><span style="color:#d83931">实</span><span style="color:#d83931">参</span>
    ret = <span style="color:#c18401">show</span>(num); <span style="color:#646a73">// show</span><span style="color:#646a73">函</span><span style="color:#646a73">数</span><span style="color:#646a73">返</span><span style="color:#646a73">回</span><span style="color:#646a73">a</span><span style="color:#646a73">的</span><span style="color:#646a73">值</span><span style="color:#646a73">会</span><span style="color:#646a73">拷</span><span style="color:#646a73">贝</span><span style="color:#646a73">给</span><span style="color:#646a73">ret</span>
}</code></pre>

##### 3.1.2.2 值传递

<p>因为存在拷贝的机制，值传递的时，不会对调用者的<span style="color:#d83931">源</span><span style="color:#d83931">数</span><span style="color:#d83931">据</span>进行破坏，所以值传递对数据起到保护和隔离的作用。体会一下下面的例子：</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">show</span>(<span style="color:#986801">int</span> a)
<span style="color:#2ea121">{</span>
    a++;
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a in show %d \n&quot;</span>, a);
    <span style="color:#a626a4">return</span> a;
}

<span style="color:#986801">void</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> num = <span style="color:#986801">10086</span>;<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">源</span><span style="color:#a0a1a7">数</span><span style="color:#a0a1a7">据</span>
    <span style="color:#986801">int</span> ret = <span style="color:#986801">0</span>;<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">返</span><span style="color:#a0a1a7">回</span><span style="color:#a0a1a7">值</span>

    ret = <span style="color:#c18401">show</span>(num);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a in main %d </span><span style="color:#50a14f">，</span><span style="color:#50a14f">ret = %d \n&quot;</span>, num, ret);
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span><span style="color:#646a73">：</span>
a in show <span style="color:#986801">10087</span>
a in main <span style="color:#986801">10086</span> ，ret = <span style="color:#986801">10087</span></code></pre>

<p>另外，大家要养成一个思维习惯：当函数结束时，函数里的局部变量（形参也是局部变量）都会被&quot;销毁&quot;，即使内存中原来的值还存在，但已经不受到系统保护，数据随时可能被覆盖、改写等等。所以当我们要返回一个局部变量的指针时，需要考虑指针指向的内存的生命周期。</p>

<p>恢复栈中的局部变量：在分析crash问题的时，通常需要分析调用栈，可以通过保存之前的栈针地址，查看原来内存的值。可参考：</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">static</span> <span style="color:#986801">unsigned</span> <span style="color:#986801">long</span> addr = <span style="color:#986801">0</span>;

<span style="color:#986801">void</span> <span style="color:#4078f2">show</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> a = <span style="color:#986801">10086</span>;
    <span style="color:#986801">int</span> b = <span style="color:#986801">10010</span>;

    <span style="color:#a626a4">asm</span> <span style="color:#4078f2">volatile</span>(<span style="color:#50a14f">&quot;movq %rbp, addr(%rip)&quot;</span>);
}

<span style="color:#986801">void</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">show</span>();

    <span style="color:#986801">int</span> *p = (<span style="color:#986801">int</span>*)addr;
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;show bp = 0x%lx, a = %d, b = %d \n&quot;</span>,addr, p[<span style="color:#986801">-1</span>], p[<span style="color:#986801">-2</span>]);

}
<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span><span style="color:#646a73">：</span>
show bp = <span style="color:#986801">0x7fffff2cacb0</span>, a = <span style="color:#986801">10010</span>, b = <span style="color:#986801">10086</span></code></pre>

##### 3.1.2.3 地址传递

<p>地址传递本质上跟值传递一样，只不过这个值有特殊的含义：代表了一个地址编号。地址传递一般用于<span style="color:#d83931">返</span><span style="color:#d83931">回</span><span style="color:#d83931">结</span><span style="color:#d83931">果</span>和<span style="color:#d83931">连</span><span style="color:#d83931">续</span><span style="color:#d83931">空</span><span style="color:#d83931">间</span><span style="color:#d83931">传</span><span style="color:#d83931">递</span>。</p>

<p><span style="color:#1456f0">3.1.2.3.1</span> 形参当做返回值</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">func</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#a626a4">return</span> <span style="color:#986801">100</span> * <span style="color:#986801">2</span>;
}

<span style="color:#986801">void</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> ret;
    ret = <span style="color:#c18401">func</span>();

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;ret = %d \n&quot;</span>, r1);
}
<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span><span style="color:#646a73">：</span>
ret = <span style="color:#986801">200</span></code></pre>

<p><span style="color:#1456f0">3.1.2.3.2</span> 多值返回</p>

<p>我们知道，函数返回return 后面只能带有一个值，所以如果有多个值需要返回的需求，可以利用值传递来做，比如，可以这样设计：</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">func</span>(<span style="color:#986801">int</span> *r1, <span style="color:#986801">int</span>* r2)
{
    <span style="color:#a626a4">if</span> (!r1 || !r2) {
        <span style="color:#a626a4">return</span> <span style="color:#986801">-1</span>;
    }

    *r1 = <span style="color:#986801">100</span> * <span style="color:#986801">2</span>;
    *r2 = <span style="color:#986801">200</span> * <span style="color:#986801">2</span>;

    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#986801">void</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> ret, r1, r2;

    ret = <span style="color:#c18401">func</span>(&amp;r1, &amp;r2);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;ret = %d, a = %d, b = %d \n&quot;</span>,ret, r1, r2);
}
<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span><span style="color:#646a73">：</span>
ret = <span style="color:#986801">0</span>, a = <span style="color:#986801">200</span>, b = <span style="color:#986801">1000</span>

Tips: 在这种情况下，这里的返回值ret代表的是func运行是否存在异常（linux 中 <span style="color:#986801">0</span> 代表正常，非
零代表异常），大家可以借鉴这个设计思想。</code></pre>

<p><span style="color:#1456f0">3.1.2.3.3</span> 连续空间传递</p>

<p>因为参数传递是内存拷贝，所以如果传入的参数是一片连续的空间，那每次调用都会进行冗余的内存分配，造成内存不必要的浪费。所以连续空间，一般都是传这片空间的首地址。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#a626a4">struct</span> <span style="color:#4078f2">abc</span> {
    <span style="color:#986801">int</span> a;
    <span style="color:#986801">int</span> b;
    <span style="color:#986801">int</span> c;
};

<span style="color:#986801">int</span> <span style="color:#4078f2">func</span>(<span style="color:#a626a4">struct</span> abc *p, <span style="color:#986801">int</span> b[])
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a = %d, b = %d, c = %d \n&quot;</span>, p-&gt;a, p-&gt;b, p-&gt;c);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%d, %d,\n&quot;</span>, b[<span style="color:#986801">0</span>], b[<span style="color:#986801">1</span>]);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#986801">void</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> ret = <span style="color:#986801">0</span>;
    <span style="color:#a626a4">struct</span> <span style="color:#4078f2">abc</span> a = {
        .a = <span style="color:#986801">1</span>,
        .b = <span style="color:#986801">2</span>,
        .c = <span style="color:#986801">3</span>,
    };
    <span style="color:#986801">int</span> b[<span style="color:#986801">2</span>] = {<span style="color:#986801">4</span>,<span style="color:#986801">5</span>};

    ret = <span style="color:#c18401">func</span>(&amp;a, b);
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span><span style="color:#646a73">：</span>
a = <span style="color:#986801">1</span>, b = <span style="color:#986801">2</span>, c = <span style="color:#986801">3</span>
<span style="color:#986801">4</span>, <span style="color:#986801">5</span>,</code></pre>

<p><span style="color:#1456f0">1.</span> 非字符空间</p>

<p>对于非字符空间，在函数设计的时候，需要传入连续地址的长度，否则默认为是<span style="color:#d83931">返</span><span style="color:#d83931">回</span><span style="color:#d83931">结</span><span style="color:#d83931">果</span>的设计。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">func</span>(<span style="color:#986801">int</span> *p, <span style="color:#986801">int</span> len)
{
    <span style="color:#986801">int</span> i;

    <span style="color:#a626a4">for</span>(i = <span style="color:#986801">0</span>;i &lt; len ; i++) {
         <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%d &quot;</span>, p[i]);
    }
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>；
}

<span style="color:#986801">void</span> <span style="color:#c18401">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> ret;
    <span style="color:#986801">int</span> arr[<span style="color:#986801">2</span>] = {<span style="color:#986801">1</span>,<span style="color:#986801">2</span>};

    ret = <span style="color:#c18401">func</span>(arr, <span style="color:#986801">2</span>);
}
<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span><span style="color:#646a73">：</span>
<span style="color:#986801">1</span> <span style="color:#986801">2</span>

<span style="color:#646a73">#</span><span style="color:#646a73">系</span><span style="color:#646a73">统</span><span style="color:#646a73">函</span><span style="color:#646a73">数</span>
<span style="color:#986801">void</span> *<span style="color:#4078f2">memcpy</span>(<span style="color:#986801">void</span> *dest, <span style="color:#986801">const</span> <span style="color:#986801">void</span> *src, <span style="color:#986801">size_t</span> n);</code></pre>

<p><span style="color:#1456f0">2.</span> 字符空间</p>

<p>在C语言中，字符空间的结束符是&#x27;\0&#x27;，所以默认情况下，传入字符空间可以不用传入字符传的长度。如：</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">func</span>(<span style="color:#986801">const</span> <span style="color:#986801">char</span> *s)
{
    <span style="color:#986801">int</span> i = <span style="color:#986801">0</span>;
    <span style="color:#a626a4">while</span> (s[i] != <span style="color:#986801">0</span>) {
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%c&quot;</span>, s[i]);
        i++;
    }
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;\n&quot;</span>);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#986801">void</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> ret = <span style="color:#986801">0</span>;
    ret = <span style="color:#c18401">func</span>(<span style="color:#50a14f">&quot;hello world&quot;</span>);
}

<span style="color:#646a73">#</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">运</span><span style="color:#646a73">行</span><span style="color:#646a73">结</span><span style="color:#646a73">果</span><span style="color:#646a73">：</span>
hello world

<span style="color:#646a73">#</span><span style="color:#646a73">系</span><span style="color:#646a73">统</span><span style="color:#646a73">函</span><span style="color:#646a73">数</span>
<span style="color:#986801">char</span> *<span style="color:#4078f2">strcpy</span>(<span style="color:#986801">char</span> *dest, <span style="color:#986801">const</span> <span style="color:#986801">char</span> *src);
<span style="color:#986801">size_t</span> <span style="color:#4078f2">strlen</span>(<span style="color:#986801">const</span> <span style="color:#986801">char</span> *s)</code></pre>

### 3.2 C与面向对象

<p>C语言是面向过程的语言，但我们可以借助C++/JAVA面向对象思想，实现类似 &quot;继承&quot;、&quot;多态&quot;、&quot;封装&quot;、&quot;重载&quot;的功能。从而服务于架构设计。</p>

#### 3.2.1 C与"继承"

<p>继承是使用已存在的类作为基础建立新的类的技术。新的类可以增加新的数据类型或者方法，也可以使用父类的功能，但不能选择性的继承父类。通过继承可以很好的复用以前的代码，提高开发效率。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;iostream&gt;</span>

<span style="color:#a626a4">using</span> <span style="color:#a626a4">namespace</span> std;

<span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">基</span><span style="color:#a0a1a7">类</span>
<span style="color:#a626a4">class</span> <span style="color:#4078f2">shape</span>  {
   <span style="color:#a626a4">protected</span>:
      <span style="color:#986801">int</span> width;
      <span style="color:#986801">int</span> height;

   <span style="color:#a626a4">public</span>:
      <span style="color:#986801">void</span> <span style="color:#4078f2">setWidth</span>(<span style="color:#986801">int</span> w) {
         width = w;
      }
      <span style="color:#986801">void</span> <span style="color:#4078f2">setHeight</span>(<span style="color:#986801">int</span> h) {
         height = h;
      }
};

<span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">派</span><span style="color:#a0a1a7">生</span><span style="color:#a0a1a7">类</span>
<span style="color:#a626a4">class</span> <span style="color:#4078f2">rectangle</span> : <span style="color:#a626a4">public</span> shape
{
   <span style="color:#a626a4">public</span>:
      <span style="color:#986801">int</span> <span style="color:#4078f2">getArea</span>() {
         <span style="color:#a626a4">return</span> (width * height);
      }
};

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
   rectangle rect;
   rect.<span style="color:#c18401">setWidth</span>(<span style="color:#986801">5</span>);
   rect.<span style="color:#c18401">setHeight</span>(<span style="color:#986801">7</span>);

   <span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">输</span><span style="color:#a0a1a7">出</span><span style="color:#a0a1a7">对</span><span style="color:#a0a1a7">象</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">面</span><span style="color:#a0a1a7">积</span>
   cout &lt;&lt; <span style="color:#50a14f">&quot;Total area: &quot;</span> &lt;&lt; rect.<span style="color:#c18401">getArea</span>() &lt;&lt; endl;

   <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}</code></pre>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;string.h&gt;</span>

<span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">基</span><span style="color:#a0a1a7">类</span>
<span style="color:#a626a4">struct</span> <span style="color:#4078f2">shape</span> {
      <span style="color:#986801">int</span> width;
      <span style="color:#986801">int</span> height;
      <span style="color:#c18401">void</span> (*setWidth)(<span style="color:#a626a4">struct</span> shape*s, <span style="color:#986801">int</span> w);
      <span style="color:#c18401">void</span> (*setHeight)(<span style="color:#a626a4">struct</span> shape*s, <span style="color:#986801">int</span> h);
};

<span style="color:#986801">void</span> <span style="color:#4078f2">setWidth</span>(<span style="color:#a626a4">struct</span> shape*s, <span style="color:#986801">int</span> w)
{
     s-&gt;width = w;
}

<span style="color:#986801">void</span> <span style="color:#4078f2">setHeight</span>(<span style="color:#a626a4">struct</span> shape*s, <span style="color:#986801">int</span> h)
{
     s-&gt;height = h;
}

<span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">派</span><span style="color:#a0a1a7">生</span><span style="color:#a0a1a7">类</span>
<span style="color:#a626a4">struct</span> <span style="color:#4078f2">rectangle</span> {
    <span style="color:#a626a4">struct</span> <span style="color:#4078f2">shape</span> s;
    <span style="color:#c18401">int</span> (*getArea)(<span style="color:#a626a4">struct</span> shape *s);
};

<span style="color:#986801">int</span> <span style="color:#4078f2">getArea</span>(<span style="color:#a626a4">struct</span> shape *s)
{
     <span style="color:#a626a4">return</span> (s-&gt;width * s-&gt;height);
}

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
   <span style="color:#a626a4">struct</span> <span style="color:#4078f2">rectangle</span> rect = {
       .s.setWidth = setWidth,
       .s.setHeight = setHeight,
       .getArea = getArea,
   };

   rect.s.<span style="color:#c18401">setWidth</span>(&amp;rect.s, <span style="color:#986801">5</span>);
   rect.s.<span style="color:#c18401">setHeight</span>(&amp;rect.s, <span style="color:#986801">7</span>);

   <span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">输</span><span style="color:#a0a1a7">出</span><span style="color:#a0a1a7">对</span><span style="color:#a0a1a7">象</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">面</span><span style="color:#a0a1a7">积</span>
   <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;Total area: %d \n&quot;</span>, rect.<span style="color:#c18401">getArea</span>(&amp;rect.s));

   <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}</code></pre>

<p>linux设备驱动中的继承</p>

<pre class="guide-code"><code><span style="color:#a0a1a7">//linux</span><span style="color:#a0a1a7">中</span><span style="color:#a0a1a7">设</span><span style="color:#a0a1a7">备</span><span style="color:#a0a1a7">模</span><span style="color:#a0a1a7">型</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">继</span><span style="color:#a0a1a7">承</span><span style="color:#a0a1a7">关</span><span style="color:#a0a1a7">系</span><span style="color:#a0a1a7">：</span><span style="color:#a0a1a7">platform_device </span><span style="color:#a0a1a7">：</span><span style="color:#a0a1a7">device </span><span style="color:#a0a1a7">：</span><span style="color:#a0a1a7">kobject</span>
<span style="color:#986801">1</span>、kobject：<span style="color:#646a73">它</span><span style="color:#646a73">是</span><span style="color:#646a73">Linux</span><span style="color:#646a73">设</span><span style="color:#646a73">备</span><span style="color:#646a73">模</span><span style="color:#646a73">型</span><span style="color:#646a73">的</span><span style="color:#646a73">核</span><span style="color:#646a73">心</span><span style="color:#646a73">之一</span><span style="color:#646a73">，</span><span style="color:#646a73">用</span><span style="color:#646a73">于</span><span style="color:#646a73">表</span><span style="color:#646a73">示</span><span style="color:#646a73">内</span><span style="color:#646a73">核</span><span style="color:#646a73">中</span><span style="color:#646a73">的</span><span style="color:#646a73">各</span><span style="color:#646a73">种</span><span style="color:#646a73">实</span><span style="color:#646a73">体</span><span style="color:#646a73">，</span><span style="color:#646a73">如</span><span style="color:#646a73">设</span><span style="color:#646a73">备</span><span style="color:#646a73">、</span><span style="color:#646a73">驱</span><span style="color:#646a73">动</span><span style="color:#646a73">程</span><span style="color:#646a73">序</span><span style="color:#646a73">、</span><span style="color:#646a73">总</span>
<span style="color:#646a73">线</span><span style="color:#646a73">、</span><span style="color:#646a73">类</span><span style="color:#646a73">别</span><span style="color:#646a73">等</span>
<span style="color:#986801">2</span>、device：<span style="color:#646a73">用</span><span style="color:#646a73">于</span><span style="color:#646a73">表</span><span style="color:#646a73">示</span><span style="color:#646a73">内</span><span style="color:#646a73">核</span><span style="color:#646a73">中</span><span style="color:#646a73">设</span><span style="color:#646a73">备</span><span style="color:#646a73">的</span><span style="color:#646a73">各</span><span style="color:#646a73">种</span><span style="color:#646a73">实</span><span style="color:#646a73">体</span><span style="color:#646a73">，</span><span style="color:#646a73">如</span><span style="color:#646a73">i2c</span><span style="color:#646a73">、</span><span style="color:#646a73">spi</span><span style="color:#646a73">、</span><span style="color:#646a73">platform</span><span style="color:#646a73">设</span><span style="color:#646a73">备</span><span style="color:#646a73">等</span>
<span style="color:#986801">3</span>、platform_device：<span style="color:#646a73">用</span><span style="color:#646a73">于</span><span style="color:#646a73">表</span><span style="color:#646a73">示</span><span style="color:#646a73">内</span><span style="color:#646a73">核</span><span style="color:#646a73">中</span><span style="color:#646a73">platform</span><span style="color:#646a73">设</span><span style="color:#646a73">备</span><span style="color:#646a73">实</span><span style="color:#646a73">体</span>

<span style="color:#a626a4">struct</span> <span style="color:#4078f2">kobject</span> {
        <span style="color:#986801">const</span> <span style="color:#986801">char</span>              *name;
        <span style="color:#a626a4">struct</span> <span style="color:#4078f2">list_head</span>        entry;
        <span style="color:#a626a4">struct</span> <span style="color:#4078f2">kobject</span>          *parent;
        <span style="color:#a626a4">struct</span> <span style="color:#4078f2">kset</span>             *kset;
        <span style="color:#a626a4">struct</span> <span style="color:#4078f2">kobj_type</span>        *ktype;
        <span style="color:#a626a4">struct</span> <span style="color:#4078f2">kernfs_node</span>      *sd;
        <span style="color:#a626a4">struct</span> <span style="color:#4078f2">kref</span>             kref;
        ....
}

<span style="color:#a626a4">struct</span> <span style="color:#4078f2">device</span> {
    <span style="color:#a626a4">struct</span> <span style="color:#4078f2">device</span>        *parent;

    <span style="color:#a626a4">struct</span> <span style="color:#4078f2">device_private</span>    *p;

    struct kobject kobj;
    .....
};

<span style="color:#a626a4">struct</span> <span style="color:#4078f2">platform_device</span> {
    <span style="color:#986801">const</span> <span style="color:#986801">char</span> *name;
    <span style="color:#986801">int</span> id;
    struct device dev;
    ....
};</code></pre>

#### 3.2.2 C与"封装"

<p>封装的概念是指：将抽象的数据和行为（或者方法）相结合，形成一个有机的整体。是面向对象思想的核心，目的是增强安全性和简化编程，使用者不必理解具体的实现细节，通过调用接口使用数据成员。</p>

<pre class="guide-code"><code><span style="color:#a626a4">class</span> <span style="color:#4078f2">car</span>  {
   <span style="color:#a626a4">protected</span>:
      <span style="color:#986801">int</span> direction;
      <span style="color:#986801">int</span> throttle；
      <span style="color:#986801">int</span> brake;

   <span style="color:#a626a4">public</span>:
      <span style="color:#986801">void</span> <span style="color:#4078f2">setDirection</span>(<span style="color:#986801">int</span> d) {
         direction = d;
      }

      <span style="color:#986801">void</span> <span style="color:#4078f2">setThrottle</span>(<span style="color:#986801">int</span> t) {
         throttle = t;
      }

      <span style="color:#986801">void</span> <span style="color:#4078f2">setBrake</span>(<span style="color:#986801">int</span> b) {
         brake= b;
      }
};</code></pre>

<p>体会以下的代码设计：</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#a626a4">class</span> <span style="color:#4078f2">person</span> {
   <span style="color:#a626a4">protected</span>:
        <span style="color:#986801">char</span> name[<span style="color:#986801">12</span>];
        <span style="color:#986801">int</span> age;

   <span style="color:#a626a4">public</span>:
        <span style="color:#986801">void</span> <span style="color:#4078f2">get_name</span>(<span style="color:#986801">char</span> *n) {
             <span style="color:#c18401">strcpy</span>(n, name);
        }
        <span style="color:#986801">void</span> <span style="color:#4078f2">get_age</span>(<span style="color:#986801">int</span> *a) {
             *a = age;
        }
        <span style="color:#c18401">person</span>(<span style="color:#986801">const</span> <span style="color:#986801">char</span> *n, <span style="color:#986801">int</span> a) {
              <span style="color:#c18401">strcpy</span>(name, n);
              age = a;
        }
};

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">char</span> name[<span style="color:#986801">12</span>];
    <span style="color:#986801">int</span> age;
    person <span style="color:#4078f2">p</span>(<span style="color:#50a14f">&quot;xiaohua&quot;</span>, <span style="color:#986801">21</span>);

    p.<span style="color:#c18401">get_age</span>(&amp;age);
    p.<span style="color:#c18401">get_name</span>(name);

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;name:%s, age:%d \n&quot;</span>,name, age);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span>
name:xiaohua, age:<span style="color:#986801">18</span></code></pre>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;string.h&gt;</span>

<span style="color:#a626a4">struct</span> <span style="color:#4078f2">person</span> {
    <span style="color:#986801">char</span> name[<span style="color:#986801">12</span>];
    <span style="color:#986801">int</span> age;
    <span style="color:#c18401">void</span> (*get_name)(<span style="color:#a626a4">struct</span> person *p, <span style="color:#986801">char</span> *name);
    <span style="color:#c18401">void</span> (*get_age)(<span style="color:#a626a4">struct</span> person *p, <span style="color:#986801">int</span> *age);
};

<span style="color:#986801">static</span> <span style="color:#986801">void</span> <span style="color:#4078f2">get_name</span>(<span style="color:#a626a4">struct</span> person *p, <span style="color:#986801">char</span> *name)
{
    <span style="color:#c18401">strcpy</span>(name, p-&gt;name);
}

<span style="color:#986801">static</span> <span style="color:#986801">void</span> <span style="color:#4078f2">get_age</span>(<span style="color:#a626a4">struct</span> person *p, <span style="color:#986801">int</span> *age)
{
    *age = p-&gt;age;
}
<span style="color:#986801">static</span> <span style="color:#a626a4">struct</span> <span style="color:#4078f2">person</span> p1 = {
    .name = <span style="color:#50a14f">&quot;xiaohua&quot;</span>,
    .age = <span style="color:#986801">21</span>,
    .get_age = get_age,
    .get_name = get_name,
};

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">char</span> name[<span style="color:#986801">12</span>] = {<span style="color:#986801">0</span>};
    <span style="color:#986801">int</span> age = <span style="color:#986801">0</span>;
    <span style="color:#a626a4">struct</span> <span style="color:#4078f2">person</span> *p = &amp;p1;

    p-&gt;<span style="color:#c18401">get_age</span>(p, &amp;age);
    p-&gt;<span style="color:#c18401">get_name</span>(p, name);

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;name:%s, age:%d \n&quot;</span>,name, age);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span>
name:xiaohua, age:<span style="color:#986801">18</span></code></pre>

<pre class="guide-code"><code><span style="color:#a0a1a7">//linux </span><span style="color:#a0a1a7">中</span><span style="color:#a0a1a7">文</span><span style="color:#a0a1a7">件</span><span style="color:#a0a1a7">系</span><span style="color:#a0a1a7">统</span><span style="color:#a0a1a7">中</span><span style="color:#a0a1a7">inode</span><span style="color:#a0a1a7">中</span><span style="color:#a0a1a7">inode_operations</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">设计</span>
<span style="color:#a626a4">struct</span> <span style="color:#4078f2">inode</span> {
        <span style="color:#a626a4">struct</span> <span style="color:#4078f2">hlist_node</span>       i_hash;              <span style="color:#a0a1a7">/* </span><span style="color:#a0a1a7">哈</span><span style="color:#a0a1a7">希</span><span style="color:#a0a1a7">表</span><span style="color:#a0a1a7"> */</span>
        <span style="color:#a626a4">struct</span> <span style="color:#4078f2">list_head</span>        i_list;              <span style="color:#a0a1a7">/* </span><span style="color:#a0a1a7">索</span><span style="color:#a0a1a7">引</span><span style="color:#a0a1a7">节</span><span style="color:#a0a1a7">点</span><span style="color:#a0a1a7">链</span><span style="color:#a0a1a7">表</span><span style="color:#a0a1a7"> */</span>
        <span style="color:#a626a4">struct</span> <span style="color:#4078f2">list_head</span>        i_dentry;            <span style="color:#a0a1a7">/* </span><span style="color:#a0a1a7">目</span><span style="color:#a0a1a7">录</span><span style="color:#a0a1a7">项</span><span style="color:#a0a1a7">链</span><span style="color:#a0a1a7">表</span><span style="color:#a0a1a7"> */</span>
        <span style="color:#986801">unsigned</span> <span style="color:#986801">long</span>           i_ino;               <span style="color:#a0a1a7">/* </span><span style="color:#a0a1a7">节</span><span style="color:#a0a1a7">点</span><span style="color:#a0a1a7">号</span><span style="color:#a0a1a7"> */</span>
        <span style="color:#986801">atomic_t</span>                i_count;             <span style="color:#a0a1a7">/* </span><span style="color:#a0a1a7">引</span><span style="color:#a0a1a7">用</span><span style="color:#a0a1a7">记</span><span style="color:#a0a1a7">数</span><span style="color:#a0a1a7"> */</span>
        <span style="color:#986801">umode_t</span>                 i_mode;              <span style="color:#a0a1a7">/* </span><span style="color:#a0a1a7">访</span><span style="color:#a0a1a7">问</span><span style="color:#a0a1a7">权</span><span style="color:#a0a1a7">限</span><span style="color:#a0a1a7">控</span><span style="color:#a0a1a7">制</span><span style="color:#a0a1a7"> */</span>
        <span style="color:#986801">unsigned</span> <span style="color:#986801">int</span>            i_nlink;             <span style="color:#a0a1a7">/* </span><span style="color:#a0a1a7">硬</span><span style="color:#a0a1a7">链</span><span style="color:#a0a1a7">接</span><span style="color:#a0a1a7">数</span><span style="color:#a0a1a7"> */</span>
        <span style="color:#986801">uid_t</span>                   i_uid;               <span style="color:#a0a1a7">/* </span><span style="color:#a0a1a7">使</span><span style="color:#a0a1a7">用</span><span style="color:#a0a1a7">者</span><span style="color:#a0a1a7">id */</span>
        <span style="color:#986801">gid_t</span>                   i_gid;               <span style="color:#a0a1a7">/* </span><span style="color:#a0a1a7">使</span><span style="color:#a0a1a7">用</span><span style="color:#a0a1a7">者</span><span style="color:#a0a1a7">id</span><span style="color:#a0a1a7">组</span><span style="color:#a0a1a7"> */</span>
        ...
        <span style="color:#a626a4">struct</span> <span style="color:#4078f2">inode_operations</span> *i_op;               <span style="color:#a0a1a7">/* </span><span style="color:#a0a1a7">索</span><span style="color:#a0a1a7">引</span><span style="color:#a0a1a7">节</span><span style="color:#a0a1a7">点</span><span style="color:#a0a1a7">操</span><span style="color:#a0a1a7">作</span><span style="color:#a0a1a7">表</span><span style="color:#a0a1a7"> */</span>
        ...
};

<span style="color:#a626a4">struct</span> <span style="color:#4078f2">inode_operations</span> {
        <span style="color:#a626a4">struct</span> <span style="color:#4078f2">dentry</span> * (*lookup) (<span style="color:#a626a4">struct</span> inode *,<span style="color:#a626a4">struct</span> dentry *, <span style="color:#a626a4">struct</span>
nameidata *);
        <span style="color:#986801">void</span> * (*follow_link) (<span style="color:#a626a4">struct</span> dentry *, <span style="color:#a626a4">struct</span> nameidata *);
        <span style="color:#c18401">int</span> (*permission) (<span style="color:#a626a4">struct</span> inode *, <span style="color:#986801">int</span>);
        <span style="color:#a626a4">struct</span> <span style="color:#4078f2">posix_acl</span> * (*get_acl)(<span style="color:#a626a4">struct</span> inode *, <span style="color:#986801">int</span>);

        <span style="color:#c18401">int</span> (*readlink) (<span style="color:#a626a4">struct</span> dentry *, <span style="color:#986801">char</span> __user *,<span style="color:#986801">int</span>);
        <span style="color:#c18401">void</span> (*put_link) (<span style="color:#a626a4">struct</span> dentry *, <span style="color:#a626a4">struct</span> nameidata *, <span style="color:#986801">void</span> *);

        <span style="color:#c18401">int</span> (*create) (<span style="color:#a626a4">struct</span> inode *,<span style="color:#a626a4">struct</span> dentry *,<span style="color:#986801">int</span>, <span style="color:#a626a4">struct</span> nameidata *);
        <span style="color:#c18401">int</span> (*link) (<span style="color:#a626a4">struct</span> dentry *,<span style="color:#a626a4">struct</span> inode *,<span style="color:#a626a4">struct</span> dentry *);
        <span style="color:#c18401">int</span> (*unlink) (<span style="color:#a626a4">struct</span> inode *,<span style="color:#a626a4">struct</span> dentry *);
        <span style="color:#c18401">int</span> (*symlink) (<span style="color:#a626a4">struct</span> inode *,<span style="color:#a626a4">struct</span> dentry *,<span style="color:#986801">const</span> <span style="color:#986801">char</span> *);
        <span style="color:#c18401">int</span> (*mkdir) (<span style="color:#a626a4">struct</span> inode *,<span style="color:#a626a4">struct</span> dentry *,<span style="color:#986801">int</span>);
        <span style="color:#c18401">int</span> (*rmdir) (<span style="color:#a626a4">struct</span> inode *,<span style="color:#a626a4">struct</span> dentry *);
        <span style="color:#c18401">int</span> (*mknod) (<span style="color:#a626a4">struct</span> inode *,<span style="color:#a626a4">struct</span> dentry *,<span style="color:#986801">int</span>,<span style="color:#986801">dev_t</span>);
        ...
};</code></pre>

#### 3.2.3 C与"多态"

<p>多态的概念是指：通过父类的指针来调用子类中的方法。作用是把不同的子类对象当做父类来看，屏蔽不同子类之间的差异，用于适应需求的不断变化，本质上是面向抽象编程，在C++中，多态的实现是通过虚函数来实现。体会一下以下这个例子：</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;string.h&gt;</span>

<span style="color:#a626a4">class</span> <span style="color:#4078f2">person</span> {
   <span style="color:#a626a4">protected</span>:
        <span style="color:#986801">char</span> name[<span style="color:#986801">24</span>];
        <span style="color:#986801">int</span> age;

   <span style="color:#a626a4">public</span>:
      <span style="color:#a626a4">virtual</span> <span style="color:#986801">void</span> <span style="color:#4078f2">get_name</span>(<span style="color:#986801">char</span> *n) {
         <span style="color:#c18401">strcpy</span>(n, name);
      }
      <span style="color:#c18401">person</span>(<span style="color:#986801">const</span> <span style="color:#986801">char</span> *n, <span style="color:#986801">int</span> a) {
          <span style="color:#c18401">strcpy</span>(name, n);
          age = a;
      }
};

<span style="color:#a626a4">class</span> <span style="color:#4078f2">usa_person</span> : <span style="color:#a626a4">public</span> person {
   <span style="color:#a626a4">public</span>:
      <span style="color:#986801">void</span> <span style="color:#4078f2">get_name</span>(<span style="color:#986801">char</span> *n) {
         <span style="color:#c18401">sprintf</span>(n, <span style="color:#50a14f">&quot;%s&quot;</span>, name);
         <span style="color:#c18401">sprintf</span>(n+<span style="color:#c18401">strlen</span>(n), <span style="color:#50a14f">&quot;%s&quot;</span>, <span style="color:#50a14f">&quot;-usa&quot;</span>);
      }
      <span style="color:#c18401">usa_person</span>(<span style="color:#986801">const</span> <span style="color:#986801">char</span> *n, <span style="color:#986801">int</span> a) : <span style="color:#c18401">person</span>(n, a) {
      }
};

<span style="color:#a626a4">class</span> <span style="color:#4078f2">china_person</span> : <span style="color:#a626a4">public</span> person {
   <span style="color:#a626a4">public</span>:
      <span style="color:#986801">void</span> <span style="color:#4078f2">get_name</span>(<span style="color:#986801">char</span> *n) {
         <span style="color:#c18401">sprintf</span>(n, <span style="color:#50a14f">&quot;%s&quot;</span>, name);
         <span style="color:#c18401">sprintf</span>(n+<span style="color:#c18401">strlen</span>(n), <span style="color:#50a14f">&quot;%s&quot;</span>, <span style="color:#50a14f">&quot;-china&quot;</span>);
      }
      <span style="color:#c18401">china_person</span>(<span style="color:#986801">const</span> <span style="color:#986801">char</span> *n, <span style="color:#986801">int</span> a) : <span style="color:#c18401">person</span>(n, a) {
      }
};

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">char</span> name[<span style="color:#986801">24</span>] = {<span style="color:#986801">0</span>};
    <span style="color:#a626a4">struct</span> <span style="color:#4078f2">person</span> *p = <span style="color:#a626a4">new</span> <span style="color:#c18401">usa_person</span>(<span style="color:#50a14f">&quot;xiaohua&quot;</span>, <span style="color:#986801">21</span>);

    p-&gt;<span style="color:#c18401">get_name</span>(name);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;name:%s \n&quot;</span>,name);
    <span style="color:#a626a4">delete</span> p;

    p = <span style="color:#a626a4">new</span> <span style="color:#c18401">china_person</span>(<span style="color:#50a14f">&quot;xiaohua&quot;</span>, <span style="color:#986801">21</span>);
    p-&gt;<span style="color:#c18401">get_name</span>(name);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;name:%s \n&quot;</span>,name);
    <span style="color:#a626a4">delete</span> p;

    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}</code></pre>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;string.h&gt;</span>

<span style="color:#a626a4">struct</span> <span style="color:#4078f2">person</span> {
    <span style="color:#986801">char</span> name[<span style="color:#986801">24</span>];
    <span style="color:#986801">int</span> age;
    <span style="color:#c18401">void</span> (*get_name)(<span style="color:#a626a4">struct</span> person *p, <span style="color:#986801">char</span> *name);
};

<span style="color:#a626a4">struct</span> <span style="color:#4078f2">usa_person</span> {
    <span style="color:#a626a4">struct</span> <span style="color:#4078f2">person</span> p;
    <span style="color:#c18401">void</span> (*get_name)(<span style="color:#a626a4">struct</span> person *p, <span style="color:#986801">char</span> *name);
};
<span style="color:#986801">static</span> <span style="color:#986801">void</span> <span style="color:#4078f2">get_name</span>(<span style="color:#a626a4">struct</span> person *p, <span style="color:#986801">char</span> *name)
{
    <span style="color:#a626a4">struct</span> <span style="color:#4078f2">usa_person</span> *child = (<span style="color:#a626a4">struct</span> usa_person *)p;

    child-&gt;<span style="color:#c18401">get_name</span>(p, name);
}

<span style="color:#986801">static</span> <span style="color:#986801">void</span> <span style="color:#4078f2">get_usa_name</span>(<span style="color:#a626a4">struct</span> person *p, <span style="color:#986801">char</span> *name)
{
    <span style="color:#c18401">sprintf</span>(name, <span style="color:#50a14f">&quot;%s&quot;</span>, p-&gt;name);
    <span style="color:#c18401">sprintf</span>(name+<span style="color:#c18401">strlen</span>(p-&gt;name), <span style="color:#50a14f">&quot;%s&quot;</span>, <span style="color:#50a14f">&quot;-usa&quot;</span>);
}

<span style="color:#986801">static</span> <span style="color:#a626a4">struct</span> <span style="color:#4078f2">usa_person</span> usa_p = {
    .get_name = get_usa_name,
    .p.get_name= get_name,
    .p.name = <span style="color:#50a14f">&quot;xiaohua&quot;</span>,
};

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">char</span> name[<span style="color:#986801">24</span>] = {<span style="color:#986801">0</span>};
    <span style="color:#a626a4">struct</span> <span style="color:#4078f2">person</span> *p = (<span style="color:#a626a4">struct</span> person *)&amp;usa_p;

    p-&gt;<span style="color:#c18401">get_name</span>(p, name);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;name:%s \n&quot;</span>,name);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}
<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span><span style="color:#a0a1a7">:</span><span style="color:#a0a1a7">通过</span><span style="color:#a0a1a7">基</span><span style="color:#a0a1a7">类</span><span style="color:#a0a1a7">person</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">对</span><span style="color:#a0a1a7">象</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">调</span><span style="color:#a0a1a7">用</span><span style="color:#a0a1a7">派</span><span style="color:#a0a1a7">生</span><span style="color:#a0a1a7">类</span><span style="color:#a0a1a7">usa</span><span style="color:#a0a1a7">中</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">方</span><span style="color:#a0a1a7">法</span>
name:usa-xiaohua</code></pre>

<pre class="guide-code"><code><span style="color:#a0a1a7">//linux</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">设</span><span style="color:#a0a1a7">备</span><span style="color:#a0a1a7">驱</span><span style="color:#a0a1a7">动</span><span style="color:#a0a1a7">模</span><span style="color:#a0a1a7">型</span><span style="color:#a0a1a7">就</span><span style="color:#a0a1a7">是</span><span style="color:#a0a1a7">典</span><span style="color:#a0a1a7">型</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">多</span><span style="color:#a0a1a7">态思</span><span style="color:#a0a1a7">想</span><span style="color:#a0a1a7">设计</span>
<span style="color:#a626a4">struct</span> <span style="color:#4078f2">platform_driver</span> {
    <span style="color:#c18401">int</span> (*probe)(<span style="color:#a626a4">struct</span> platform_device *);
    <span style="color:#c18401">int</span> (*remove)(<span style="color:#a626a4">struct</span> platform_device *);
    <span style="color:#c18401">void</span> (*shutdown)(<span style="color:#a626a4">struct</span> platform_device *);
    <span style="color:#c18401">int</span> (*suspend)(<span style="color:#a626a4">struct</span> platform_device *, <span style="color:#986801">pm_message_t</span> state);
    <span style="color:#c18401">int</span> (*resume)(<span style="color:#a626a4">struct</span> platform_device *);
    <span style="color:#a626a4">struct</span> <span style="color:#4078f2">device_driver</span> driver;
    ...
};

<span style="color:#986801">int</span> <span style="color:#4078f2">platform_driver_register</span>(<span style="color:#a626a4">struct</span> platform_driver *drv)
{
    ...
    <span style="color:#a626a4">if</span> (drv-&gt;probe)
            <span style="color:#d83931">drv-&gt;driver.probe = platform_drv_probe</span>;
    <span style="color:#a626a4">if</span> (drv-&gt;remove)
            drv-&gt;driver.remove = platform_drv_remove;
    <span style="color:#a626a4">if</span> (drv-&gt;shutdown)
            drv-&gt;driver.shutdown = platform_drv_shutdown;
    <span style="color:#a626a4">if</span> (drv-&gt;suspend)
            drv-&gt;driver.suspend = platform_drv_suspend;
    <span style="color:#a626a4">if</span> (drv-&gt;resume)
            drv-&gt;driver.resume = platform_drv_resume;
    <span style="color:#a626a4">return</span> <span style="color:#c18401">driver_register</span>(&amp;drv-&gt;driver);
}

<span style="color:#986801">static</span> <span style="color:#986801">int</span> <span style="color:#4078f2">platform_drv_probe</span>(<span style="color:#a626a4">struct</span> device *_dev)
{
    <span style="color:#a626a4">struct</span> <span style="color:#4078f2">platform_driver</span> *drv = <span style="color:#c18401">to_platform_driver</span>(_dev-&gt;driver);
    <span style="color:#a626a4">struct</span> <span style="color:#4078f2">platform_device</span> *dev = <span style="color:#c18401">to_platform_device</span>(_dev);
    ...
    <span style="color:#a626a4">return</span> drv-&gt;<span style="color:#c18401">probe</span>(dev);
}

<span style="color:#245bdb"> driver</span>.probe <span style="color:#d83931">-&gt; platform_drv_probe-&gt;to_platform_driver(_dev-&gt;driver)-&gt;    </span><span style="color:#245bdb">drv</span><span style="color:#d83931">-</span>
<span style="color:#d83931">&gt;probe</span>
 (device_driver类)
(platform_driver类)
<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">父</span><span style="color:#a0a1a7">类</span><span style="color:#a0a1a7">：</span><span style="color:#a0a1a7">driver</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">派</span><span style="color:#a0a1a7">生</span><span style="color:#a0a1a7">类</span><span style="color:#a0a1a7">platform_driver </span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">通过</span><span style="color:#a0a1a7">driver</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">probe</span><span style="color:#a0a1a7">最</span><span style="color:#a0a1a7">终</span><span style="color:#a0a1a7">调</span><span style="color:#a0a1a7">用</span><span style="color:#a0a1a7">到</span><span style="color:#a0a1a7">platform_driver</span><span style="color:#a0a1a7">的</span>
<span style="color:#a0a1a7">probe</span></code></pre>

#### 3.2.4 C与"重载"

<p>重载的概念是指：在同一个范围中声明几个同名函数，但同名函数的形参不同（个数、类型、顺序），一般是用来处理功能类似但是数据类型不同的问题。严格意义上C的编译器不支持重载，但我们有一些方法达到相同的目的</p>

<pre class="guide-code"><code><span style="color:#a0a1a7">//printf</span><span style="color:#a0a1a7">函</span><span style="color:#a0a1a7">数</span><span style="color:#a0a1a7">是</span><span style="color:#a0a1a7">C</span><span style="color:#a0a1a7">中</span><span style="color:#a0a1a7">典</span><span style="color:#a0a1a7">型</span><span style="color:#a0a1a7">有</span><span style="color:#a0a1a7">重</span><span style="color:#a0a1a7">载</span><span style="color:#a0a1a7">效</span><span style="color:#a0a1a7">果</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">函</span><span style="color:#a0a1a7">数</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%s \n&quot;</span>, <span style="color:#50a14f">&quot;hello world&quot;</span>);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%s %s \n&quot;</span>, <span style="color:#50a14f">&quot;hello world 1&quot;</span>, <span style="color:#50a14f">&quot;hello world 2&quot;</span>);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%d %s \n&quot;</span>, <span style="color:#986801">10</span>, <span style="color:#50a14f">&quot;hello world 1&quot;</span>);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%s %d \n&quot;</span>, <span style="color:#50a14f">&quot;hello world 1&quot;</span>, <span style="color:#986801">10</span>);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}</code></pre>

##### 3.2.4.1 可变参数函数

<pre class="guide-code"><code><span style="color:#986801">void</span> <span style="color:#4078f2">va_func</span>(强制参数, 可变参数)
1. 强制参数有至少有一个，代表以一种规则，由函数定义者自行定义和解析。
2. 可变参数可以有多个，函数定义者和调用者自行决定

va_list: 一个元素的结构体数组
----/usr/lib/gcc/x86_64-linux-gnu/<span style="color:#986801">9</span>/include-----
typedef __builtin_va_list __gnuc_va_list;
<span style="color:#a626a4">typedef</span> __gnuc_va_list va_list; <span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">一个</span><span style="color:#a0a1a7">元</span><span style="color:#a0a1a7">素</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">构</span><span style="color:#a0a1a7">体</span><span style="color:#a0a1a7">数</span><span style="color:#a0a1a7">组</span>

va_list = <span style="color:#a626a4">struct</span> __va_list_tag {
    <span style="color:#986801">unsigned</span> <span style="color:#986801">int</span> gp_offset;
    <span style="color:#986801">unsigned</span> <span style="color:#986801">int</span> fp_offset;
    <span style="color:#986801">void</span> *overflow_arg_area;
    <span style="color:#986801">void</span> *reg_save_area;
} [<span style="color:#986801">1</span>]

va_start：定位到可变参数的地址
va_arg：遍历可变参数
va_end：终止va_list遍历

<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> va_start(v,l)   __builtin_va_start(v,l)</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> va_end(v)   __builtin_va_end(v)</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> va_arg(v,l) __builtin_va_arg(v,l)</span></code></pre>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdarg.h&gt;</span>

<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">这</span><span style="color:#a0a1a7">里</span><span style="color:#a0a1a7">约</span><span style="color:#a0a1a7">定</span><span style="color:#a0a1a7">n</span><span style="color:#a0a1a7">为</span><span style="color:#a0a1a7">后</span><span style="color:#a0a1a7">面</span><span style="color:#a0a1a7">参</span><span style="color:#a0a1a7">数</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">个</span><span style="color:#a0a1a7">数</span><span style="color:#a0a1a7">（</span><span style="color:#a0a1a7">一</span><span style="color:#a0a1a7">种</span><span style="color:#a0a1a7">规</span><span style="color:#a0a1a7">则</span><span style="color:#a0a1a7">）</span>
<span style="color:#986801">static</span> <span style="color:#986801">void</span> <span style="color:#4078f2">va_func</span>(<span style="color:#986801">int</span> n, ...)
{
    va_list ptr;
    <span style="color:#c18401">va_start</span>(ptr, n);
    <span style="color:#a626a4">while</span> (n--) {
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%d \n&quot;</span>, <span style="color:#c18401">va_arg</span>(ptr, <span style="color:#986801">int</span>));
    }
    <span style="color:#c18401">va_end</span>(ptr);
}
<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">va_func</span>(<span style="color:#986801">1</span>, <span style="color:#986801">100</span>);
    <span style="color:#c18401">va_func</span>(<span style="color:#986801">2</span>, <span style="color:#986801">200</span>, <span style="color:#986801">300</span>);

    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span><span style="color:#a0a1a7">:</span>
<span style="color:#986801">100</span>
<span style="color:#986801">200</span>
<span style="color:#986801">300</span></code></pre>

<pre class="guide-code"><code><span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">选</span><span style="color:#a0a1a7">自</span><span style="color:#a0a1a7">glibc-2.40</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;libioP.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdarg.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#4078f2">#</span><span style="color:#a626a4">undef</span><span style="color:#4078f2"> printf</span>

<span style="color:#a0a1a7">/* Write formatted output to stdout from the format string FORMAT.  */</span>
<span style="color:#a0a1a7">/* VARARGS1 */</span>
<span style="color:#986801">int</span>
__printf (<span style="color:#986801">const</span> <span style="color:#986801">char</span> *format, ...)
{
  va_list arg;
  <span style="color:#986801">int</span> done;

  <span style="color:#c18401">va_start</span> (arg, format);
  done = __vfprintf_internal (stdout, format, arg, <span style="color:#986801">0</span>);
  <span style="color:#c18401">va_end</span> (arg);

  <span style="color:#a626a4">return</span> done;
}

<span style="color:#4078f2">#</span><span style="color:#a626a4">undef</span><span style="color:#4078f2"> _IO_printf</span>
<span style="color:#c18401">ldbl_strong_alias</span> (__printf, printf);
<span style="color:#c18401">ldbl_strong_alias</span> (__printf, _IO_printf);</code></pre>

##### 3.2.4.2 回调函数+void*

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#a626a4">class</span> <span style="color:#4078f2">swap</span> {
    <span style="color:#a626a4">public</span>:
      <span style="color:#986801">void</span> <span style="color:#4078f2">exchange</span>(<span style="color:#986801">int</span> *a, <span style="color:#986801">int</span> *b) {
         <span style="color:#986801">int</span> tmp = *a;
         *a = *b;
         *b = tmp;
      }
      <span style="color:#986801">void</span> <span style="color:#4078f2">exchange</span>(<span style="color:#986801">double</span> *a, <span style="color:#986801">double</span> *b) {
         doubl e tmp = *a;
         *a = *b;
         *b = tmp;
      }
};

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    swap s;
    <span style="color:#986801">int</span> a = <span style="color:#986801">10</span>;
    <span style="color:#986801">int</span> b = <span style="color:#986801">20</span>;
    <span style="color:#986801">double</span> c = <span style="color:#986801">1.23</span>;
    <span style="color:#986801">double</span> d = <span style="color:#986801">4.56</span>;

    s.<span style="color:#c18401">exchange</span>(&amp;a, &amp;b);
    s.<span style="color:#c18401">exchange</span>(&amp;c, &amp;d);

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a = %d, b = %d \n&quot;</span>, a , b);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;c = %f, d = %f \n&quot;</span>, c , d);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}</code></pre>

<pre class="guide-code"><code><span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">实</span><span style="color:#a0a1a7">现</span><span style="color:#a0a1a7">一个</span><span style="color:#a0a1a7">可</span><span style="color:#a0a1a7">以</span><span style="color:#a0a1a7">交</span><span style="color:#a0a1a7">换</span><span style="color:#a0a1a7">不</span><span style="color:#a0a1a7">同</span><span style="color:#a0a1a7">数</span><span style="color:#a0a1a7">据</span><span style="color:#a0a1a7">类</span><span style="color:#a0a1a7">型</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">swap</span><span style="color:#a0a1a7">函</span><span style="color:#a0a1a7">数</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdarg.h&gt;</span>

<span style="color:#a626a4">typedef</span> <span style="color:#4078f2">void</span> (*func)(<span style="color:#986801">void</span>*, <span style="color:#986801">void</span>*);
<span style="color:#986801">void</span> <span style="color:#4078f2">swap</span>(func exchange, <span style="color:#986801">void</span> *a, <span style="color:#986801">void</span> *b)
{
    <span style="color:#c18401">exchange</span>(a, b);
}

<span style="color:#986801">void</span> <span style="color:#4078f2">exchange_int</span>(<span style="color:#986801">void</span> *a, <span style="color:#986801">void</span> *b)
{
    <span style="color:#986801">int</span> *_a = (<span style="color:#986801">int</span>*)a;
    <span style="color:#986801">int</span> *_b = (<span style="color:#986801">int</span>*)b;
    <span style="color:#986801">int</span> tmp = <span style="color:#986801">0</span>;
    tmp = *_a;
    *_a = *_b;
    *_b= tmp ;
}

<span style="color:#986801">void</span> <span style="color:#4078f2">exchange_double</span>(<span style="color:#986801">void</span> *a, <span style="color:#986801">void</span> *b)
{
    <span style="color:#986801">double</span>*_a = (<span style="color:#986801">double</span>*)a;
    <span style="color:#986801">double</span>*_b = (<span style="color:#986801">double</span>*)b;
    <span style="color:#986801">double</span> tmp = <span style="color:#986801">0</span>;

    tmp = *_a;
    *_a = *_b;
    *_b= tmp;
}

<span style="color:#986801">void</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> a = <span style="color:#986801">10</span>;
    <span style="color:#986801">int</span> b = <span style="color:#986801">20</span>;
    <span style="color:#986801">double</span> c = <span style="color:#986801">1.23</span>;
    <span style="color:#986801">double</span> d = <span style="color:#986801">4.56</span>;

    <span style="color:#c18401">swap</span>(exchange_int, &amp;a, &amp;b);
    <span style="color:#c18401">swap</span>(exchange_double, &amp;c, &amp;d);

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a = %d, b = %d \n&quot;</span>, a , b);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;c = %f, d = %f \n&quot;</span>, c , d);
}

<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span><span style="color:#a0a1a7">:</span>
a = <span style="color:#986801">20</span>, b = <span style="color:#986801">10</span>
c = <span style="color:#986801">4.560000</span>, d = <span style="color:#986801">1.230000</span></code></pre>

##### 3.2.4.3 弱连接函数（weak）

<p>这个在驱动设计时，经常用到。weak修饰的函数属于弱连接函数，当前工程中如果有定义跟其相同的函数时，weak修饰的函数会被编译覆盖，达到override的效果。</p>

<pre class="guide-code"><code><span style="color:#a0a1a7">//1.c</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#a626a4">extern</span> <span style="color:#986801">void</span> <span style="color:#4078f2">config</span>(<span style="color:#986801">void</span>);
<span style="color:#986801">void</span> __attribute__((weak)) <span style="color:#c18401">config</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;config default\n&quot;</span>);
}

<span style="color:#986801">void</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">config</span>();
}

<span style="color:#a0a1a7">//2.c</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#986801">void</span> <span style="color:#4078f2">config</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#a0a1a7">//i2c bus no</span>
    <span style="color:#a0a1a7">//LDO</span>
    <span style="color:#a0a1a7">//hardware reg config</span>
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;config one \n&quot;</span>);
}

<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span><span style="color:#a0a1a7">:</span>
config two</code></pre>

<pre class="guide-code"><code><span style="color:#a0a1a7">//stm32</span><span style="color:#a0a1a7">中</span><span style="color:#a0a1a7">常</span><span style="color:#a0a1a7">用</span><span style="color:#a0a1a7">于</span><span style="color:#a0a1a7">设计</span><span style="color:#a0a1a7">中</span><span style="color:#a0a1a7">断</span><span style="color:#a0a1a7">回</span><span style="color:#a0a1a7">调</span><span style="color:#a0a1a7">函</span><span style="color:#a0a1a7">数</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">当</span><span style="color:#a0a1a7">用</span><span style="color:#a0a1a7">户</span><span style="color:#a0a1a7">自</span><span style="color:#a0a1a7">定</span><span style="color:#a0a1a7">义了</span><span style="color:#a0a1a7">相</span><span style="color:#a0a1a7">同</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">callback</span><span style="color:#a0a1a7">函</span><span style="color:#a0a1a7">数</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">就</span><span style="color:#a0a1a7">会</span><span style="color:#a0a1a7">跑</span><span style="color:#a0a1a7">用</span><span style="color:#a0a1a7">户</span><span style="color:#a0a1a7">自</span><span style="color:#a0a1a7">定</span><span style="color:#a0a1a7">义</span><span style="color:#a0a1a7">函</span><span style="color:#a0a1a7">数</span><span style="color:#a0a1a7">，</span>
<span style="color:#a0a1a7">表</span><span style="color:#a0a1a7">现</span><span style="color:#a0a1a7">出</span><span style="color:#a0a1a7">很</span><span style="color:#a0a1a7">好</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">拓</span><span style="color:#a0a1a7">展</span><span style="color:#a0a1a7">性</span><span style="color:#a0a1a7">设计</span>

<span style="color:#4078f2">#</span><span style="color:#a626a4">ifndef</span><span style="color:#4078f2"> __weak</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> __weak  __attribute__((weak))</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">endif</span>

<span style="color:#a0a1a7">/**</span>
<span style="color:#a0a1a7">  * @brief  EXTI line detection callbacks.</span>
<span style="color:#a0a1a7">  * @param  GPIO_Pin: Specifies the pins connected EXTI line</span>
<span style="color:#a0a1a7">  * @retval None</span>
<span style="color:#a0a1a7">  */</span>
__weak <span style="color:#986801">void</span> <span style="color:#4078f2">HAL_GPIO_EXTI_Callback</span>(<span style="color:#986801">uint16_t</span> GPIO_Pin)
{
  <span style="color:#a0a1a7">/* Prevent unused argument(s) compilation warning */</span>
  <span style="color:#c18401">UNUSED</span>(GPIO_Pin);
  <span style="color:#a0a1a7">/* </span><span style="color:#a626a4">NOTE:</span><span style="color:#a0a1a7"> This function Should not be modified, when the callback is needed,</span>
<span style="color:#a0a1a7">           the HAL_GPIO_EXTI_Callback could be implemented in the user file</span>
<span style="color:#a0a1a7">   */</span>
}</code></pre>

### 3.3 solid设计原则

<p>solid设计是面向对象的原则，是由Gang of Four<span style="color:#245bdb">（</span><span style="color:#336df4">四</span><span style="color:#336df4">人</span><span style="color:#336df4">帮</span><span style="color:#245bdb">）</span>，即Erich Gamma, Richard Helm, Ralph Johnson &amp; John Vlissides四人）的《设计模式》（1995年出版）是第一次将设计模式提升到理论高度，并将之规范化。</p>

![原文图解（第 113 页）](assets/figures/p113-04.png)

<p>这些原则属于建议性原则，大家在做架构设计的时候要从实际的业务角度出发，切记不要为了设计而设计（冗余设计）。</p>

#### 3.3.1 单一职责原则

<p>一个类只负责一件事情。价值：高内聚，低耦合，拓展性和健壮性强。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#a626a4">class</span> <span style="color:#4078f2">Game</span> {
public:
        DataCompute();
        ~DataCompute();

        <span style="color:#986801">void</span> <span style="color:#4078f2">setShapen</span>();
        <span style="color:#986801">void</span> <span style="color:#4078f2">setPlace</span>();

        <span style="color:#986801">void</span> <span style="color:#4078f2">showViewCcon</span>(); <span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">游</span><span style="color:#a0a1a7">戏</span><span style="color:#a0a1a7">方</span><span style="color:#a0a1a7">块</span><span style="color:#a0a1a7">显</span><span style="color:#a0a1a7">示</span>
private:
        <span style="color:#986801">int</span> mPlace[<span style="color:#986801">4</span>];                <span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">位</span><span style="color:#a0a1a7">置</span>
        <span style="color:#986801">int</span> mShape[<span style="color:#986801">4</span>];                <span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">形</span><span style="color:#a0a1a7">状</span>

        DataCompute *mDataCompute;    <span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">游</span><span style="color:#a0a1a7">戏</span><span style="color:#a0a1a7">逻</span><span style="color:#a0a1a7">辑</span>
        <span style="color:#986801">int</span> mStartButton;             <span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">开</span><span style="color:#a0a1a7">始</span><span style="color:#a0a1a7">按</span><span style="color:#a0a1a7">钮</span>
        <span style="color:#986801">int</span> mEndButton;               <span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">束</span><span style="color:#a0a1a7">按</span><span style="color:#a0a1a7">钮</span>
};
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">游</span><span style="color:#a0a1a7">戏</span><span style="color:#a0a1a7">逻</span><span style="color:#a0a1a7">辑</span>
<span style="color:#a626a4">class</span> <span style="color:#4078f2">DataCompute</span> {
public:
        DataCompute();
        ~DataCompute();

        <span style="color:#986801">void</span> <span style="color:#4078f2">setShapen</span>();
        <span style="color:#986801">void</span> <span style="color:#4078f2">setPlace</span>();
private:
        <span style="color:#986801">int</span> mPlace[<span style="color:#986801">4</span>];                <span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">位</span><span style="color:#a0a1a7">置</span>
        <span style="color:#986801">int</span> mShape[<span style="color:#986801">4</span>];                <span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">形</span><span style="color:#a0a1a7">状</span>
};

<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">游</span><span style="color:#a0a1a7">戏</span><span style="color:#a0a1a7">界</span><span style="color:#a0a1a7">面</span>
<span style="color:#a626a4">class</span> <span style="color:#4078f2">GameUI</span>
{
public:
        GameUI();
        ~GameUI();

        <span style="color:#986801">void</span> <span style="color:#4078f2">showViewCcon</span>();              <span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">游</span><span style="color:#a0a1a7">戏</span><span style="color:#a0a1a7">方</span><span style="color:#a0a1a7">块</span><span style="color:#a0a1a7">显</span><span style="color:#a0a1a7">示</span>
private:
        DataCompute *mDataCompute;        <span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">游</span><span style="color:#a0a1a7">戏</span><span style="color:#a0a1a7">逻</span><span style="color:#a0a1a7">辑</span>
        <span style="color:#986801">int</span> mStartButton;                 <span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">开</span><span style="color:#a0a1a7">始</span><span style="color:#a0a1a7">按</span><span style="color:#a0a1a7">钮</span>
        <span style="color:#986801">int</span> mEndButton;                   <span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">束</span><span style="color:#a0a1a7">按</span><span style="color:#a0a1a7">钮</span>
};</code></pre>

<p>在C语言中，就是一个结构体在设计和封装的时候只负责一个事情。以一个imu器件的驱动结构体为例：</p>

<pre class="guide-code"><code><span style="color:#a626a4">struct</span> <span style="color:#4078f2">imu_operations</span> {
    <span style="color:#c18401">int</span> (*init)(<span style="color:#a626a4">struct</span> int_param_s *int_param);
    <span style="color:#c18401">int</span> (*set_bypass)(<span style="color:#986801">unsigned</span> <span style="color:#986801">char</span> bypass_on);
    <span style="color:#c18401">int</span> (*enable_sensor)(<span style="color:#986801">unsigned</span> <span style="color:#986801">char</span> sensors);
    <span style="color:#c18401">int</span> (*configure_fifo)(<span style="color:#986801">unsigned</span> <span style="color:#986801">char</span> sensors);
    <span style="color:#c18401">int</span> (*set_sample_rate)(<span style="color:#986801">unsigned</span> <span style="color:#986801">short</span> rate);
    <span style="color:#c18401">int</span> (*set_mag_sample_rate)(<span style="color:#986801">unsigned</span> <span style="color:#986801">short</span> rate);
    <span style="color:#c18401">int</span> (*get_sample_rate)(<span style="color:#986801">unsigned</span> <span style="color:#986801">short</span> *rate);
    <span style="color:#c18401">int</span> (*set_gyro_fsr)(<span style="color:#986801">unsigned</span> <span style="color:#986801">short</span> fsr);
    <span style="color:#c18401">int</span> (*set_accel_fsr)(<span style="color:#986801">unsigned</span> <span style="color:#986801">char</span> fsr);
    <span style="color:#c18401">int</span> (*get_gyro_fsr)(<span style="color:#986801">unsigned</span> <span style="color:#986801">short</span> *fsr);
    <span style="color:#c18401">int</span> (*get_accel_fsr)(<span style="color:#986801">unsigned</span> <span style="color:#986801">char</span> *fsr);
    <span style="color:#c18401">int</span> (*get_compass_fsr)(<span style="color:#986801">unsigned</span> <span style="color:#986801">short</span> *fsr);
    <span style="color:#c18401">int</span> (*get_gyro_sens)(<span style="color:#986801">float</span> *sens);
    <span style="color:#c18401">int</span> (*get_mag_sens)(<span style="color:#986801">float</span> *sens);
    <span style="color:#c18401">int</span> (*get_accel_sens)(<span style="color:#986801">unsigned</span> <span style="color:#986801">short</span> *sens);
    <span style="color:#c18401">int</span> (*read_gyro_data)(<span style="color:#986801">short</span> *data, <span style="color:#986801">unsigned</span> <span style="color:#986801">long</span> *timestamp);
    <span style="color:#c18401">int</span> (*read_accel_data)(<span style="color:#986801">short</span> *data, <span style="color:#986801">unsigned</span> <span style="color:#986801">long</span> *timestamp);
    <span style="color:#c18401">int</span> (*read_mag_data)(<span style="color:#986801">short</span> *data, <span style="color:#986801">unsigned</span> <span style="color:#986801">long</span> *timestamp);
};

<span style="color:#a626a4">struct</span> <span style="color:#4078f2">imu_chip</span> {
    <span style="color:#a626a4">struct</span> <span style="color:#4078f2">imu_operations</span> *ops;
    <span style="color:#a626a4">struct</span> <span style="color:#4078f2">imu_data</span> accel_data[CALI_DATA_LEN];
    <span style="color:#a626a4">struct</span> <span style="color:#4078f2">imu_data</span> gyro_data[CALI_DATA_LEN];
    <span style="color:#a626a4">struct</span> <span style="color:#4078f2">imu_data</span> compass_data[CALI_DATA_LEN];
    ...
}</code></pre>

#### 3.3.2 开闭原则

<p>软件中的对象（类、模块、函数等）应该满足对于拓展是开放的，对修改是封闭的。体会一下模块化编程的例子：</p>

<pre class="guide-code"><code><span style="color:#a0a1a7">//keil stm32 </span><span style="color:#a0a1a7">方</span><span style="color:#a0a1a7">案</span>
<span style="color:#a0a1a7">//module_init.h</span>
<span style="color:#a626a4">typedef</span> <span style="color:#4078f2">void</span> (*<span style="color:#986801">init_t</span>)(<span style="color:#986801">void</span>);

<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> module_init(fn) \</span>
<span style="color:#4078f2">const init_t __embedi_##fn __attribute__((section(</span><span style="color:#50a14f">&quot;embedi_init&quot;</span><span style="color:#4078f2">)))  </span>
<span style="color:#4078f2">__attribute__((used)) = fn</span>

<span style="color:#a0a1a7">//module_init.c</span>
<span style="color:#a626a4">extern</span> <span style="color:#986801">int</span> embedi_init$$Base;
<span style="color:#a626a4">extern</span> <span style="color:#986801">int</span> embedi_init$$Length;

<span style="color:#986801">void</span> <span style="color:#4078f2">embedi_module_init</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">init_t</span>* init_call = (<span style="color:#986801">init_t</span>*)&amp;embedi_init$$Base;
    <span style="color:#986801">int</span> count = <span style="color:#986801">0</span>;

    count = (<span style="color:#986801">int</span>)(&amp;embedi_init$$Length) / <span style="color:#c18401">sizeof</span>(<span style="color:#986801">init_t</span>);
    <span style="color:#a626a4">while</span> (count--) {
        (*init_call)();
        init_call++;
    }
    <span style="color:#c18401">osLog</span>(<span style="color:#50a14f">&quot;module init \n&quot;</span>);
}

<span style="color:#a0a1a7">//1.c</span>
<span style="color:#986801">static</span> <span style="color:#986801">void</span> <span style="color:#4078f2">module_one_init</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#a0a1a7">// do something</span>
}
<span style="color:#c18401">module_init</span>(module_one_init);

<span style="color:#a0a1a7">//2.c</span>
<span style="color:#986801">static</span> <span style="color:#986801">void</span> <span style="color:#4078f2">module_two_init</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#a0a1a7">// do something</span>
}
<span style="color:#c18401">module_init</span>(module_two_init);</code></pre>

<pre class="guide-code"><code><span style="color:#a0a1a7">//GCC </span><span style="color:#a0a1a7">方</span><span style="color:#a0a1a7">案</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#a626a4">typedef</span> <span style="color:#4078f2">void</span> (*<span style="color:#986801">init_t</span>)(<span style="color:#986801">void</span>);

<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> module_init(fn) \</span>
<span style="color:#4078f2">const init_t __embedi_##fn __attribute__((section(</span><span style="color:#50a14f">&quot;.embedi_init&quot;</span><span style="color:#4078f2">)))  </span>
<span style="color:#4078f2">__attribute__((used)) = fn</span>

<span style="color:#a0a1a7">//module_init.c</span>
<span style="color:#a626a4">extern</span> <span style="color:#986801">init_t</span> __init_start;
<span style="color:#a626a4">extern</span> <span style="color:#986801">init_t</span> __init_end;

<span style="color:#986801">void</span> <span style="color:#4078f2">embedi_module_init</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">init_t</span>* init_call = (<span style="color:#986801">init_t</span>*)&amp;__init_start;

    <span style="color:#a626a4">for</span> ( ; init_call &lt; &amp;__init_end; init_call++){
        (*init_call)();
    }
}

<span style="color:#986801">static</span> <span style="color:#986801">void</span> <span style="color:#4078f2">module_one_init</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%s call \n&quot;</span>, __FUNCTION__);
}
module_init(module_one_init);
<span style="color:#986801">static</span> <span style="color:#986801">void</span> <span style="color:#4078f2">module_two_init</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%s call \n&quot;</span>, __FUNCTION__);
}
module_init(module_two_init);

<span style="color:#a0a1a7">//1.lds</span>
__init_start = .;
.embedi_init : {*(.embedi_init)}
__init_end = .;

<span style="color:#a0a1a7">//gcc -o bin 1.c -T 1.lds</span></code></pre>

#### 3.3.3 里氏替换原则

<p>里氏替换原则：简单来讲就是子类可以去拓展父类的功能，但不能改变父类原有的功能。技术上，所有引用基类的地方必须能够透明的使用其子类的对象。价值：继承一定程度上破坏了封装，此原则用来包含封装性。但嵌入式中应用相对较少，可以感受一下下面这个例子：</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;iostream&gt;</span>

<span style="color:#a626a4">using</span> <span style="color:#a626a4">namespace</span> std;

<span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">基</span><span style="color:#a0a1a7">类</span>
<span style="color:#a626a4">class</span> <span style="color:#4078f2">birds</span>  {
   <span style="color:#a626a4">protected</span>:
      <span style="color:#986801">int</span> flySpeed;
      <span style="color:#986801">int</span> runSpeed;

   <span style="color:#a626a4">public</span>:
      <span style="color:#986801">void</span> <span style="color:#4078f2">setFlySpeed</span>(<span style="color:#986801">int</span> s) {
         flySpeed = s;
      }
      <span style="color:#986801">void</span> <span style="color:#4078f2">setRunSpeed</span>(<span style="color:#986801">int</span> s) {
         runSpeed = s;
      }
      <span style="color:#986801">int</span> <span style="color:#4078f2">getFlySpeed</span>(<span style="color:#986801">void</span>) {
         <span style="color:#a626a4">return</span> flySpeed;
      }
      <span style="color:#986801">int</span> <span style="color:#4078f2">getRunSpeed</span>(<span style="color:#986801">void</span>) {
         <span style="color:#a626a4">return</span> runSpeed;
      }
      <span style="color:#986801">int</span> <span style="color:#4078f2">calculateFlyTime</span>(<span style="color:#986801">int</span> distance) {
         <span style="color:#a626a4">return</span> distance / flySpeed;
      }
};

<span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">派</span><span style="color:#a0a1a7">生</span><span style="color:#a0a1a7">类</span>
<span style="color:#a626a4">class</span> <span style="color:#4078f2">swallow</span> : <span style="color:#a626a4">public</span> birds
{

};

<span style="color:#a626a4">class</span> <span style="color:#4078f2">ostrich</span> : <span style="color:#a626a4">public</span> birds
{
   <span style="color:#a626a4">public</span>:
      <span style="color:#986801">void</span> <span style="color:#4078f2">setFlySpeed</span>(<span style="color:#986801">int</span> s) {
         flySpeed = <span style="color:#986801">0</span>;
      }
};

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
   birds *b1 = <span style="color:#a626a4">new</span> swallow;
   birds *b2 = <span style="color:#a626a4">new</span> ostrich;
   <span style="color:#986801">int</span> distance = <span style="color:#986801">100</span>;

   b1-&gt;<span style="color:#c18401">setFlySpeed</span>(<span style="color:#986801">10</span>);
   cout &lt;&lt; <span style="color:#50a14f">&quot;b1 flySpeed: &quot;</span> &lt;&lt; b1-&gt;<span style="color:#c18401">getFlySpeed</span>() &lt;&lt; endl;
   cout &lt;&lt; <span style="color:#50a14f">&quot;b1 flyTime: &quot;</span>  &lt;&lt; b1-&gt;<span style="color:#c18401">calculateFlyTime</span>(distance) &lt;&lt; endl;

   b2-&gt;<span style="color:#c18401">setFlySpeed</span>(<span style="color:#986801">0</span>);
   cout &lt;&lt; <span style="color:#50a14f">&quot;b2 flySpeed: &quot;</span> &lt;&lt; b2-&gt;<span style="color:#c18401">getFlySpeed</span>() &lt;&lt; endl;
   cout &lt;&lt; <span style="color:#50a14f">&quot;b2 flyTime: &quot;</span>  &lt;&lt; b2-&gt;<span style="color:#c18401">calculateFlyTime</span>(distance) &lt;&lt; endl;

   <span style="color:#a626a4">delete</span> b1;
   <span style="color:#a626a4">delete</span> b2;

   <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}</code></pre>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;iostream&gt;</span>

using namespace <span style="color:#c18401">std</span>;

<span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">基</span><span style="color:#a0a1a7">类</span>
<span style="color:#a626a4">class</span> <span style="color:#4078f2">animal</span> {
   protected:
      <span style="color:#986801">int</span> runSpeed;

   public:
      <span style="color:#986801">void</span> <span style="color:#4078f2">setRunSpeed</span>(<span style="color:#986801">int</span> s) {
         runSpeed = s;
      }
      <span style="color:#986801">int</span> <span style="color:#4078f2">getRunSpeed</span>(<span style="color:#986801">void</span>) {
         <span style="color:#a626a4">return</span> runSpeed;
      }
};
<span style="color:#a626a4">class</span> <span style="color:#4078f2">birds</span>  : public animal {
   protected:
      <span style="color:#986801">int</span> flySpeed;

   public:
      <span style="color:#986801">void</span> <span style="color:#4078f2">setFlySpeed</span>(<span style="color:#986801">int</span> s) {
         flySpeed = s;
      }
      <span style="color:#986801">int</span> <span style="color:#4078f2">getFlySpeed</span>(<span style="color:#986801">void</span>) {
         <span style="color:#a626a4">return</span> flySpeed;
      }
      <span style="color:#986801">int</span> <span style="color:#4078f2">calculateFlyTime</span>(<span style="color:#986801">int</span> distance) {
         <span style="color:#a626a4">return</span> distance / flySpeed;
      }
};

<span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">派</span><span style="color:#a0a1a7">生</span><span style="color:#a0a1a7">类</span>
<span style="color:#a626a4">class</span> <span style="color:#4078f2">swallow</span> : public birds
{
};

<span style="color:#a626a4">class</span> <span style="color:#4078f2">ostrich</span> : public animal
{

};</code></pre>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;string.h&gt;</span>

<span style="color:#a626a4">struct</span> <span style="color:#4078f2">birds</span>  {
    <span style="color:#986801">int</span> flySpeed;
    <span style="color:#986801">int</span> runSpeed;
    <span style="color:#986801">void</span> (*setFlySpeed)(<span style="color:#a626a4">struct</span> birds *b, <span style="color:#986801">int</span> s);
    <span style="color:#986801">void</span> (*setRunSpeed)(<span style="color:#a626a4">struct</span> birds *b, <span style="color:#986801">int</span> s);
    <span style="color:#986801">int</span> (*getFlySpeed)(<span style="color:#a626a4">struct</span> birds *b);
    <span style="color:#986801">int</span> (*getRunSpeed)(<span style="color:#a626a4">struct</span> birds *b);
    <span style="color:#986801">int</span> (*calculateFlyTime)(<span style="color:#a626a4">struct</span> birds *b, <span style="color:#986801">int</span> distance);
};

<span style="color:#986801">void</span> <span style="color:#4078f2">setFlySpeed</span>(<span style="color:#a626a4">struct</span> birds *b, <span style="color:#986801">int</span> s) {
    b-&gt;flySpeed = s;
}
<span style="color:#986801">void</span> <span style="color:#4078f2">setRunSpeed</span>(<span style="color:#a626a4">struct</span> birds *b, <span style="color:#986801">int</span> s) {
    b-&gt;runSpeed = s;
}
<span style="color:#986801">int</span> <span style="color:#4078f2">getFlySpeed</span>(<span style="color:#a626a4">struct</span> birds *b) {
    <span style="color:#a626a4">return</span> b-&gt;flySpeed;
}
<span style="color:#986801">int</span> <span style="color:#4078f2">getRunSpeed</span>(<span style="color:#a626a4">struct</span> birds *b) {
    <span style="color:#a626a4">return</span> b-&gt;runSpeed;
}
<span style="color:#986801">int</span> <span style="color:#4078f2">calculateFlyTime</span>(<span style="color:#a626a4">struct</span> birds *b, <span style="color:#986801">int</span> distance) {
    <span style="color:#a626a4">return</span> distance / b-&gt;flySpeed;
}

<span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">派</span><span style="color:#a0a1a7">生</span><span style="color:#a0a1a7">类</span>
<span style="color:#a626a4">struct</span> <span style="color:#4078f2">swallow</span> {
    <span style="color:#a626a4">struct</span> <span style="color:#4078f2">birds</span> <span style="color:#4078f2">b</span>;
};

<span style="color:#a626a4">struct</span> <span style="color:#4078f2">ostrich</span> {
    <span style="color:#a626a4">struct</span> <span style="color:#4078f2">birds</span> <span style="color:#4078f2">b</span>;
};

<span style="color:#a626a4">struct</span> <span style="color:#4078f2">swallow</span> <span style="color:#4078f2">s</span> = {
    .b.setFlySpeed = setFlySpeed,
    .b.setRunSpeed = setRunSpeed,
    .b.getFlySpeed = getFlySpeed,
    .b.getRunSpeed = getRunSpeed,
    .b.calculateFlyTime = calculateFlyTime,
};

<span style="color:#a626a4">struct</span> <span style="color:#4078f2">ostrich</span> <span style="color:#4078f2">o</span> = {
    .b.setFlySpeed = setFlySpeed,
    .b.setRunSpeed = setRunSpeed,
    .b.getFlySpeed = getFlySpeed,
    .b.getRunSpeed = getRunSpeed,
    .b.calculateFlyTime = calculateFlyTime,
};

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
   <span style="color:#a626a4">struct</span> <span style="color:#4078f2">birds</span> *<span style="color:#4078f2">b1</span> = (<span style="color:#a626a4">struct</span> birds*)&amp;s;
   <span style="color:#a626a4">struct</span> <span style="color:#4078f2">birds</span> *<span style="color:#4078f2">b2</span> = (<span style="color:#a626a4">struct</span> birds*)&amp;o;
   <span style="color:#986801">int</span> distance = <span style="color:#986801">100</span>;

   b1-&gt;setFlySpeed(b1, <span style="color:#986801">10</span>);
   <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;b1 flySpeed: %d \n&quot;</span>, b1-&gt;getFlySpeed(b1));
   <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;b1 flyTime: %d \n&quot;</span>,  b1-&gt;calculateFlyTime(b1, distance));

   b2-&gt;setFlySpeed(b2, <span style="color:#986801">0</span>);
   <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;b2 flySpeed: %d \n&quot;</span>, b2-&gt;getFlySpeed(b2));
   <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;b2 flyTime: %d \n&quot;</span>,  b2-&gt;calculateFlyTime(b2, distance));

   <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}</code></pre>

#### 3.3.4 接口隔离原则

<p>定义：不应该强迫用户端实现一个它用不上的接口。具体两个的例子：</p>

<p><span style="color:#1456f0">1.</span> 抽象了面积和体积的两个接口，客户端在使用的这个接口的时候会发现，对于正方形来说没有体积，所以实现体积的函数对它来说就是冗余的。</p>

<p><span style="color:#1456f0">2.</span> 抽象了器件初始化和读取数据的接口。对于LED灯来说，一般都是控制型，没有必要实现一个读LED数据的接口，所以对LED来说，读取数据就是冗余的。</p>

![原文图解（第 121 页）](assets/figures/p121-31.png)

#### 3.3.5 依赖倒置原则

<p>高层次模块不应该依赖测层次的模块，实际上是面向抽象编程思想，这样可以降低代码间的耦合度，使其看扩展、易维护。举一个驱动的例子：在这个架构设计中，IMU有很多公共的业务逻辑：初始化、读取数据、数据校准等等，这些业务逻辑不应该耦合具体驱动的接口，而是依赖于抽象接口；同时驱动与驱动之间也不能互相调用，而是调用抽象接口。后续的器件增加拓展，只需要修改驱动部分，抽象层都不会改动。</p>

![原文图解（第 122 页）](assets/figures/p122-00.png)

## 4. 内存视角

<p>前面在学习数据类型关键字的时候我们了解到，定义一个变量的本质是在内存中圈定一块特定大小的内存。本章将会对内存的位置、生命周期、操作权限等做更多的探讨。</p>

![原文图解（第 122 页）](assets/figures/p122-04.png)

### 4.1 内存基础概念

#### 4.1.1 内存空间分布图

<p>内存分布分成静态区和动态区，静态区在编译时已经决定了内存分配大小，动态区是运行时分配。</p>

![原文图解（第 123 页）](assets/figures/p123-00.png)

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> global_inited = <span style="color:#986801">10</span>;  <span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">全</span><span style="color:#a0a1a7">局</span><span style="color:#a0a1a7">初</span><span style="color:#a0a1a7">始</span><span style="color:#a0a1a7">化</span><span style="color:#a0a1a7">变</span><span style="color:#a0a1a7">量</span>
<span style="color:#986801">int</span> global_uninited;  <span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">全</span><span style="color:#a0a1a7">局</span><span style="color:#a0a1a7">未</span><span style="color:#a0a1a7">初</span><span style="color:#a0a1a7">始</span><span style="color:#a0a1a7">化</span><span style="color:#a0a1a7">变</span><span style="color:#a0a1a7">量</span>
<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> local_var = <span style="color:#986801">20</span>;  <span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">局</span><span style="color:#a0a1a7">部</span><span style="color:#a0a1a7">变</span><span style="color:#a0a1a7">量</span>
    <span style="color:#986801">char</span> *str = <span style="color:#50a14f">&quot;Hello&quot;</span>;  <span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">字</span><span style="color:#a0a1a7">符</span><span style="color:#a0a1a7">串</span><span style="color:#a0a1a7">常</span><span style="color:#a0a1a7">量</span>
    <span style="color:#986801">static</span> <span style="color:#986801">int</span> static_var = <span style="color:#986801">30</span>;  <span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">静</span><span style="color:#a0a1a7">态</span><span style="color:#a0a1a7">变</span><span style="color:#a0a1a7">量</span>
    <span style="color:#986801">int</span> *heap_var = (<span style="color:#986801">int</span> *)<span style="color:#c18401">malloc</span>(<span style="color:#c18401">sizeof</span>(<span style="color:#986801">int</span>)); <span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">动</span><span style="color:#a0a1a7">态</span><span style="color:#a0a1a7">分</span><span style="color:#a0a1a7">配</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">内</span><span style="color:#a0a1a7">存</span>

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;address of code: %p\n&quot;</span>, main);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;address of str: %p\n&quot;</span>, str);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;address of global_inited : %p\n&quot;</span>, (<span style="color:#986801">void</span> *)&amp;global_inited );
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;address of static_var: %p\n&quot;</span>, (<span style="color:#986801">void</span> *)&amp;static_var);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;address of global_uninited: %p\n&quot;</span>, (<span style="color:#986801">void</span> *)&amp;global_uninited);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;address of heap_var : %p\n&quot;</span>, (<span style="color:#986801">void</span> *)heap_var);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;address of local_var : %p\n&quot;</span>, (<span style="color:#986801">void</span> *)&amp;local_var);

    <span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">释</span><span style="color:#a0a1a7">放</span><span style="color:#a0a1a7">动</span><span style="color:#a0a1a7">态</span><span style="color:#a0a1a7">分</span><span style="color:#a0a1a7">配</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">内</span><span style="color:#a0a1a7">存</span>
    <span style="color:#c18401">free</span>(heap_var);

    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}
<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span><span style="color:#a0a1a7">：</span>
address of code: <span style="color:#986801">0x55e737e1f1a9</span>
address of str: <span style="color:#986801">0x55e737e20008</span>
address of global_inited : <span style="color:#986801">0x55e737e22010</span>
address of static_var: <span style="color:#986801">0x55e737e22014</span>
address of global_uninited: <span style="color:#986801">0x55e737e2201c</span>
address of heap_var : <span style="color:#986801">0x55e738cb12a0</span>
address of local_var : <span style="color:#986801">0x7ffe44b03c14</span></code></pre>

##### 4.1.1.1 代码段

<p>代码段只能读不可以写，写会触发Segmentation fault (core dumped)，俗称&quot;段错误&quot;。在整个程序生命周期内合法有效。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">void</span> <span style="color:#4078f2">func</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;hello func \n&quot;</span>);
}

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;func addr %p \n&quot;</span>, func);

    <span style="color:#c18401">void</span> (*p)(<span style="color:#986801">void</span>) = func;
    <span style="color:#a0a1a7">//try to access</span>
    <span style="color:#c18401">p</span>();
    <span style="color:#986801">int</span> *p1 = (<span style="color:#986801">int</span> *)func;
    <span style="color:#a0a1a7">//try to read</span>
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;func addr %d \n&quot;</span>, *p1);
    <span style="color:#a0a1a7">//try to write</span>
    *p1 = <span style="color:#986801">1</span>;
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}
<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span><span style="color:#a0a1a7">：</span>
func addr <span style="color:#986801">0x561398e14169</span>
hello func
func addr <span style="color:#986801">-98693133</span>
Segmentation <span style="color:#4078f2">fault</span> (core dumped)</code></pre>

##### 4.1.1.2 只读数据段

<p>只读数据段存放字符传常量，地址比代码段更高。权限是：只能读不可以写，写会触发Segmentation fault (core dumped)，在整个程序生命周期内合法有效。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%s read only data addr: %p \n&quot;</span>, <span style="color:#50a14f">&quot;hello world&quot;</span>, <span style="color:#50a14f">&quot;hello world&quot;</span>);
    <span style="color:#986801">char</span> *s = <span style="color:#50a14f">&quot;hallo world&quot;</span>;
    s[<span style="color:#986801">1</span>] = <span style="color:#50a14f">&#x27;e&#x27;</span>;<span style="color:#a0a1a7">//try to write rodata Segmentation </span>
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}
<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span><span style="color:#a0a1a7">：</span>
read only data addr: <span style="color:#986801">0x56014766f008</span>
Segmentation <span style="color:#4078f2">fault</span> (core dumped)</code></pre>

##### 4.1.1.3 全局数据段

<p>全局变量和局部static修饰的变量会放在全局数据段（data/bbs），允许读写，在整个程序生命周期内合法有效。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#986801">int</span> a = <span style="color:#986801">10</span>;
<span style="color:#986801">int</span> b;

<span style="color:#986801">int</span> <span style="color:#4078f2">func</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">static</span> <span style="color:#986801">int</span> d = <span style="color:#986801">10</span>;
    b++;
    <span style="color:#a626a4">return</span> ++d;
}

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">static</span> <span style="color:#986801">int</span> c;
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%p , %p, %p \n&quot;</span>, &amp;a, &amp;b, &amp;c);
    <span style="color:#a0a1a7">//try to write data Segmentation</span>
    a = <span style="color:#986801">20</span>;
    b = <span style="color:#986801">30</span>;
    c = <span style="color:#986801">40</span>;
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a = %d , b = %d, c = %d \n&quot;</span>, a, b, c);

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;b = %d , d = %d, d = %d\n&quot;</span>, b, <span style="color:#c18401">func</span>(), <span style="color:#c18401">func</span>());
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}
<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span><span style="color:#a0a1a7">：</span><span style="color:#a0a1a7"> </span>
<span style="color:#986801">0x5556e9e9b010</span> , <span style="color:#986801">0x5556e9e9b020</span>, <span style="color:#986801">0x5556e9e9b01c</span>
a = <span style="color:#986801">20</span> , b = <span style="color:#986801">30</span>, c = <span style="color:#986801">40</span>
b = <span style="color:#986801">32</span> , d = <span style="color:#986801">12</span>, d = <span style="color:#986801">11</span></code></pre>

##### 4.1.1.4 堆空间

<p>堆空间在运行时由程序员来分配（malloc）和释放（free），可读可写，生命周期是程序员来决定。值得注意的是，如果在一个函数中分配堆内存，函数执行结束后malloc空间不会被释放，如果不手动进行释放的话，会造成内存泄漏。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdlib.h&gt;</span>

<span style="color:#986801">void</span> <span style="color:#4078f2">func</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> *heap_var = (<span style="color:#986801">int</span> *)<span style="color:#c18401">malloc</span>(<span style="color:#c18401">sizeof</span>(<span style="color:#986801">int</span>)); <span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">动</span><span style="color:#a0a1a7">态</span><span style="color:#a0a1a7">分</span><span style="color:#a0a1a7">配</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">内</span><span style="color:#a0a1a7">存</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">单</span><span style="color:#a0a1a7">位</span><span style="color:#a0a1a7">是</span><span style="color:#a0a1a7">B</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">默</span><span style="color:#a0a1a7">认</span><span style="color:#a0a1a7">反</span>
<span style="color:#a0a1a7">馈</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">类</span><span style="color:#a0a1a7">型</span><span style="color:#a0a1a7">是</span><span style="color:#a0a1a7">void*</span>
    <span style="color:#a626a4">if</span> (!heap_var) {
        <span style="color:#a626a4">return</span>;
    }
    <span style="color:#a0a1a7">//try to write heap Segmentation</span>
    *heap_var = <span style="color:#986801">10</span>;
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;heap addr = %p , heap_var = %d\n&quot;</span>, heap_var, *heap_var);
    <span style="color:#c18401">free</span>(heap_var);<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">如</span><span style="color:#a0a1a7">果</span><span style="color:#a0a1a7">没</span><span style="color:#a0a1a7">有</span><span style="color:#a0a1a7">free</span><span style="color:#a0a1a7">动</span><span style="color:#a0a1a7">作</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">heap_var</span><span style="color:#a0a1a7">指</span><span style="color:#a0a1a7">向</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">内</span><span style="color:#a0a1a7">存</span><span style="color:#a0a1a7">就</span><span style="color:#a0a1a7">存</span><span style="color:#a0a1a7">在</span><span style="color:#a0a1a7">泄</span><span style="color:#a0a1a7">漏</span><span style="color:#a0a1a7">：</span><span style="color:#a0a1a7">不</span><span style="color:#a0a1a7">会</span><span style="color:#a0a1a7">再</span><span style="color:#a0a1a7">使</span><span style="color:#a0a1a7">用</span><span style="color:#a0a1a7">但</span><span style="color:#a0a1a7">又</span><span style="color:#a0a1a7">不</span>
<span style="color:#a0a1a7">能</span><span style="color:#a0a1a7">分</span><span style="color:#a0a1a7">配</span><span style="color:#a0a1a7">给</span><span style="color:#a0a1a7">别</span><span style="color:#a0a1a7">人</span>
}

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">func</span>();
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}</code></pre>

<pre class="guide-code"><code><span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span><span style="color:#a0a1a7">：</span>
heap addr = <span style="color:#986801">0x55bf2b8db2a0</span> , heap_var = <span style="color:#986801">10</span></code></pre>

##### 4.1.1.5 栈空间

<p>栈空间指的是在函数运行时的上下文分配的空间，可读可写，生命周期在函数执行结束后结束。看下面的一个例子：buff和s都是局部变量，系统会给buff分配sizeof(&quot;hello world&quot;)栈空间，而s的栈空间是4byte，它指向只读数据段中的字符串&quot;hello world&quot;地址编号。所以这里返回buff就会有问题，返回指针没有问题。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">char</span>* <span style="color:#4078f2">func</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">char</span> *s = <span style="color:#50a14f">&quot;hello world&quot;</span>;
    <span style="color:#986801">char</span> buff[] = <span style="color:#50a14f">&quot;hello world&quot;</span>;

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;func:%s \n&quot;</span>, buff);
    <span style="color:#a626a4">return</span> s;
}
<span style="color:#986801">void</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">char</span> *p = <span style="color:#c18401">func</span>();
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;main:%s \n&quot;</span>, p);
}</code></pre>

![原文图解（第 127 页）](assets/figures/p127-28.png)

<p>堆栈的生长方向问题：</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdlib.h&gt;</span>
<span style="color:#986801">void</span> <span style="color:#4078f2">func</span>(<span style="color:#986801">int</span> *a)
{
    <span style="color:#986801">int</span> *p1 = (<span style="color:#986801">int</span> *)<span style="color:#c18401">malloc</span>(<span style="color:#c18401">sizeof</span>(<span style="color:#986801">int</span>));
    <span style="color:#986801">int</span> *p2 = (<span style="color:#986801">int</span> *)<span style="color:#c18401">malloc</span>(<span style="color:#c18401">sizeof</span>(<span style="color:#986801">int</span>));
    <span style="color:#a626a4">if</span> (p2 &gt; p1) {
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;heap upward \n&quot;</span>);
    } <span style="color:#a626a4">else</span> {
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;heap downward \n&quot;</span>);
    }
    <span style="color:#c18401">free</span>(p1);
    <span style="color:#c18401">free</span>(p2);

    <span style="color:#986801">int</span> a = <span style="color:#986801">1</span>;
    <span style="color:#986801">int</span> b = <span style="color:#986801">2</span>;
    <span style="color:#a626a4">if</span> (&amp;b &gt; a) {
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;stack upward \n&quot;</span>);
    } <span style="color:#a626a4">else</span> {
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;stack downward \n&quot;</span>);
    }
}

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> a;

    <span style="color:#c18401">func</span>(&amp;a);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}</code></pre>

#### 4.1.2 内存溢出问题

<p>内存溢出指的是程序运行过程中，访问超过其分配空间范围的内存区域。</p>

##### 4.1.2.1 栈溢出

<p>递归函数：递归函数如果没有正常的退出条件，最后会把整个栈空间消耗殆尽，最后出现段错误。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">void</span> <span style="color:#4078f2">try_overflow</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> a = <span style="color:#986801">10</span>;
    <span style="color:#c18401">try_overflow</span>();
}

<span style="color:#986801">void</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">try_overflow</span>();
}
<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span><span style="color:#a0a1a7">：</span>
Segmentation <span style="color:#4078f2">fault</span> (core dumped)

<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">汇</span><span style="color:#a0a1a7">编</span>
try_overflow:
.LFB0:
    endbr64
    pushq   %rbp
    movq    %rsp, %rbp
<span style="color:#d83931">    subq    $16, %rsp //</span><span style="color:#d83931">分</span><span style="color:#d83931">配</span><span style="color:#d83931">栈</span><span style="color:#d83931">空</span><span style="color:#d83931">间</span><span style="color:#d83931">的</span><span style="color:#d83931">内</span><span style="color:#d83931">存</span>
    movl    $<span style="color:#986801">10</span>, <span style="color:#986801">-4</span>(%rbp)
    call    try_overflow //反复调用
    nop
    leave
    ret</code></pre>

<p>很大的局部变量</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;string.h&gt;</span>

<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> N 8192*1024</span>
<span style="color:#986801">void</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">char</span> arr[N];
    <span style="color:#c18401">memset</span>(arr, <span style="color:#50a14f">&#x27;c&#x27;</span>, <span style="color:#c18401">sizeof</span>(<span style="color:#986801">char</span>)*N);

    <span style="color:#a626a4">for</span> (<span style="color:#986801">int</span> i = <span style="color:#986801">0</span>; i &lt; N; i++) {
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%c&quot;</span>, arr[i]);
    }
    <span style="color:#c18401">puts</span>(<span style="color:#50a14f">&quot;&quot;</span>);
}

<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span><span style="color:#a0a1a7">：</span>
Segmentation <span style="color:#4078f2">fault</span> (core dumped)

murphy@ubuntu:/home/workspace/course$ ulimit -a
core file size          (blocks, -c) <span style="color:#986801">0</span>
data seg size           (kbytes, -d) unlimited
scheduling priority             (-e) <span style="color:#986801">0</span>
file size               (blocks, -f) unlimited
pending signals                 (-i) <span style="color:#986801">15152</span>
max locked memory       (kbytes, -l) <span style="color:#986801">65536</span>
max memory size         (kbytes, -m) unlimited
open files                      (-n) <span style="color:#986801">1024</span>
pipe size            (<span style="color:#986801">512</span> bytes, -p) <span style="color:#986801">8</span>
POSIX message queues     (bytes, -q) <span style="color:#986801">819200</span>
real-time priority              (-r) <span style="color:#986801">0</span>
stack size              (kbytes, -s) 8192
cpu time               (seconds, -t) unlimited
max user processes              (-u) <span style="color:#986801">15152</span>
virtual memory          (kbytes, -v) unlimited
file locks                      (-x) unlimited</code></pre>

<p>栈缓冲区溢出</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;string.h&gt;</span>

<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> N 10</span>
<span style="color:#986801">void</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">char</span> arr[N];
    <span style="color:#986801">char</span> arr1[] = <span style="color:#50a14f">&quot;hello world&quot;</span>;

    <span style="color:#c18401">strcpy</span>(arr, arr1);<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">工</span><span style="color:#a0a1a7">程</span><span style="color:#a0a1a7">上</span><span style="color:#a0a1a7">建</span><span style="color:#a0a1a7">议</span><span style="color:#a0a1a7">不</span><span style="color:#a0a1a7">要</span><span style="color:#a0a1a7">用</span><span style="color:#a0a1a7">strcpy</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">用</span><span style="color:#a0a1a7">strncpy</span>
    <span style="color:#a0a1a7">//strncpy(arr, arr1</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">N);</span>
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;arr:%s \n&quot;</span>,arr);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;arr1:%s \n&quot;</span>,arr1);
}
<span style="color:#a0a1a7">//strcpy</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span>
arr:hello world
arr1:d

<span style="color:#a0a1a7">//strncpy</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span>
arr:hello worlhello world <span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">原</span><span style="color:#a0a1a7">因</span><span style="color:#a0a1a7">是</span><span style="color:#a0a1a7">arr</span><span style="color:#a0a1a7">长</span><span style="color:#a0a1a7">度</span><span style="color:#a0a1a7">不</span><span style="color:#a0a1a7">够</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">copy N</span><span style="color:#a0a1a7">个</span><span style="color:#a0a1a7">字</span><span style="color:#a0a1a7">符</span><span style="color:#a0a1a7">中</span><span style="color:#a0a1a7">缺</span><span style="color:#a0a1a7">少</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">束</span><span style="color:#a0a1a7">符</span><span style="color:#a0a1a7">&#x27;\0&#x27;</span>
arr1:hello world</code></pre>

##### 4.1.2.2 堆缓冲区溢出

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;string.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdlib.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> N 5</span>
<span style="color:#986801">void</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">char</span> *str = (<span style="color:#986801">char</span>*)<span style="color:#c18401">malloc</span>(<span style="color:#c18401">sizeof</span>(<span style="color:#986801">char</span>)*N);
    <span style="color:#986801">char</span> *str1 = (<span style="color:#986801">char</span>*)<span style="color:#c18401">malloc</span>(<span style="color:#c18401">sizeof</span>(<span style="color:#986801">char</span>)*N);

    <span style="color:#c18401">strcpy</span>(str1, <span style="color:#50a14f">&quot;hello world&quot;</span>);
    <span style="color:#c18401">strcpy</span>(str, <span style="color:#50a14f">&quot;hello world&quot;</span>);

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;str:%s \n&quot;</span>,str);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;str1:%s \n&quot;</span>,str1);
}

<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span><span style="color:#a0a1a7">：</span><span style="color:#a0a1a7">溢</span><span style="color:#a0a1a7">出</span><span style="color:#a0a1a7">没</span><span style="color:#a0a1a7">有</span><span style="color:#a0a1a7">显</span><span style="color:#a0a1a7">示</span><span style="color:#a0a1a7">出</span><span style="color:#a0a1a7">异</span><span style="color:#a0a1a7">常</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">但</span><span style="color:#a0a1a7">已</span><span style="color:#a0a1a7">经</span><span style="color:#a0a1a7">污</span><span style="color:#a0a1a7">染</span><span style="color:#a0a1a7">了</span><span style="color:#a0a1a7">堆</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">其</span><span style="color:#a0a1a7">他</span><span style="color:#a0a1a7">区</span><span style="color:#a0a1a7">域</span>
str:hello world
str1:hello world</code></pre>

### 4.2 指针

<p>前面在介绍指针类型时，已经知道指针变量圈定的内存大小<span style="color:#d83931">跟</span><span style="color:#d83931">编</span><span style="color:#d83931">译</span><span style="color:#d83931">器</span><span style="color:#d83931">有</span><span style="color:#d83931">关</span><span style="color:#d83931">或</span><span style="color:#d83931">者</span><span style="color:#d83931">说</span><span style="color:#d83931">跟</span><span style="color:#d83931">CPU</span><span style="color:#d83931">的</span><span style="color:#d83931">地址</span><span style="color:#d83931">总</span><span style="color:#d83931">线</span><span style="color:#d83931">有</span><span style="color:#d83931">关</span>。在32位的系统中，指针类型占用4byte，在64位的系统中，指针类型占用8byte。指针变量的值有特殊意义，代表了一个地址编号，本章讲重点讲指针访问内存的规则和技巧。另外，希望大家对这两个概念：指针和指针变量，有清晰的区分。我们一般说指针，代表就是这个<span style="color:#d83931">指</span><span style="color:#d83931">针</span><span style="color:#d83931">变</span><span style="color:#d83931">量</span><span style="color:#d83931">的</span><span style="color:#d83931">值</span>，即内存地址；指针变量就是一个变量，用于存放内存地址。</p>

![原文图解（第 131 页）](assets/figures/p131-36.png)

#### 4.2.1 指针访问内存

<p>要访问指针指向的地址，那就必然需要回答两个问题： 1、内存的可读可写性是什么？ 2、内存的访问规则是什么？</p>

##### 4.2.1.1 指针变量的初始化

<p>大家要养成思维习惯：每当看到一个指针变量，要对其值的合法性保持敬畏。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdlib.h&gt;</span>

<span style="color:#986801">int</span> b = <span style="color:#986801">20</span>;
<span style="color:#986801">void</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> a = <span style="color:#986801">10</span>;
    <span style="color:#986801">int</span> *p1 = &amp;a;
    <span style="color:#986801">int</span> *p2 = &amp;b;
    <span style="color:#986801">int</span> *p3 = (<span style="color:#986801">int</span>*)<span style="color:#c18401">malloc</span>(<span style="color:#c18401">sizeof</span>(<span style="color:#986801">int</span>));
    <span style="color:#a626a4">if</span> (!p3) {
       <span style="color:#a626a4">return</span>;
    }
    *p3 = <span style="color:#986801">30</span>;

    <span style="color:#986801">int</span> *p;
    p = (<span style="color:#986801">int</span> *)<span style="color:#986801">100</span>;<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">从</span><span style="color:#a0a1a7">复</span><span style="color:#a0a1a7">制</span><span style="color:#a0a1a7">语</span><span style="color:#a0a1a7">法</span><span style="color:#a0a1a7">上</span><span style="color:#a0a1a7">可</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">但</span><span style="color:#a0a1a7">内</span><span style="color:#a0a1a7">存</span><span style="color:#a0a1a7">不</span><span style="color:#a0a1a7">可</span><span style="color:#a0a1a7">读</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">不</span><span style="color:#a0a1a7">可</span><span style="color:#a0a1a7">写</span>

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;*p1 = %d, *p2 = %d, *p3 = %d \n&quot;</span>, *p1, *(&amp;b), p3[<span style="color:#986801">0</span>]);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;p = %p \n&quot;</span>, p);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;*p = %d \n&quot;</span>, *p);

    <span style="color:#c18401">free</span>(p3);
}

<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span><span style="color:#a0a1a7">：</span>
*p1 = <span style="color:#986801">10</span>, *p2 = <span style="color:#986801">20</span>, *p3 = <span style="color:#986801">30</span>
p = <span style="color:#986801">0x64</span>
Segmentation <span style="color:#c18401">fault</span> (core dumped)</code></pre>

##### 4.2.1.2 空指针和野指针

<p>空指针很好理解，就是值为0（NULL）的指针变量，如果访问了0地址就会出现非法访问的错误。野指针是指值为非法地址的指针变量。野指针在实际工程中有很大的危害，会造成代码的稳定问题（不可预知的bug）。要形成free后，把指针变量置空（NULL）的习惯。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;string.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdlib.h&gt;</span>

<span style="color:#986801">void</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> *ptr = <span style="color:#0184bb">NULL</span>;
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot; *p = %d \n&quot;</span>, *ptr);

    ptr = (<span style="color:#986801">int</span>*)<span style="color:#c18401">malloc</span>(<span style="color:#a626a4">sizeof</span>(<span style="color:#986801">int</span>));
    *ptr = <span style="color:#986801">102</span>;
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot; *p = %d \n&quot;</span>, *ptr);

    <span style="color:#c18401">free</span>(ptr);
}</code></pre>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;string.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdlib.h&gt;</span>

<span style="color:#986801">void</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> *ptr = (<span style="color:#986801">int</span>*)<span style="color:#c18401">malloc</span>(<span style="color:#c18401">sizeof</span>(<span style="color:#986801">int</span>));
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot; *ptr = %d \n&quot;</span>, *ptr);
    <span style="color:#c18401">free</span>(ptr);
    <span style="color:#a0a1a7">//ptr = NULL;</span>
    <span style="color:#a626a4">if</span> (<span style="color:#0184bb">NULL</span> != ptr) {
        *ptr = <span style="color:#986801">102</span>;
    }

    <span style="color:#986801">int</span> *p = (<span style="color:#986801">int</span>*)<span style="color:#c18401">malloc</span>(<span style="color:#c18401">sizeof</span>(<span style="color:#986801">int</span>));
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot; *p = %d \n&quot;</span>, *p);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot; ptr = %p \n&quot;</span>, ptr);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;   p = %p \n&quot;</span>, p);
    <span style="color:#a0a1a7">//*ptr = 101;</span>
}

<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span><span style="color:#a0a1a7">：</span>
  *ptr = <span style="color:#986801">0</span>
  *p = <span style="color:#986801">102</span> <span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">指</span><span style="color:#a0a1a7">针</span><span style="color:#a0a1a7">执</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">内</span><span style="color:#a0a1a7">容</span><span style="color:#a0a1a7">被</span><span style="color:#a0a1a7">别</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">指</span><span style="color:#a0a1a7">针</span><span style="color:#a0a1a7">（</span><span style="color:#a0a1a7">ptr</span><span style="color:#a0a1a7">）</span><span style="color:#a0a1a7">修</span><span style="color:#a0a1a7">改</span><span style="color:#a0a1a7">了</span>
 ptr = <span style="color:#986801">0x55bf1f2cc2a0</span> <span style="color:#a0a1a7">//ptr</span><span style="color:#a0a1a7">就</span><span style="color:#a0a1a7">是</span><span style="color:#a0a1a7">野</span><span style="color:#a0a1a7">指</span><span style="color:#a0a1a7">针</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">指</span><span style="color:#a0a1a7">向</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">这</span><span style="color:#a0a1a7">块</span><span style="color:#a0a1a7">内</span><span style="color:#a0a1a7">存</span><span style="color:#a0a1a7">已</span><span style="color:#a0a1a7">经</span><span style="color:#a0a1a7">不</span><span style="color:#a0a1a7">属</span><span style="color:#a0a1a7">于</span><span style="color:#a0a1a7">它</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">但</span><span style="color:#a0a1a7">是</span><span style="color:#a0a1a7">它</span><span style="color:#a0a1a7">仍</span><span style="color:#a0a1a7">可</span><span style="color:#a0a1a7">以</span><span style="color:#a0a1a7">非</span><span style="color:#a0a1a7">法</span><span style="color:#a0a1a7">访</span><span style="color:#a0a1a7">问</span>
   p = <span style="color:#986801">0x55bf1f2cc2a0</span></code></pre>

##### 4.2.1.3 指针访问内存的规则

<p>我们前面学过几种指针访问内存的方式：*p、p[x]、p-&gt;x。那每次访问的大小是多少呢？我们知道指针变量的定义的形式是：数据类型 * p；所以每次访问的大小由前面修饰的数据类型决定。</p>

<p><span style="color:#1456f0">4.2.1.3.1</span> 标准数据类型指针</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">void</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> a = <span style="color:#986801">0x12345678</span>;

    <span style="color:#986801">int</span> *p = &amp;a;
    <span style="color:#986801">char</span> *p1 = (<span style="color:#986801">char</span>*)&amp;a;

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot; *p  = 0x%x \n&quot;</span>, *p);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot; *p1 = 0x%x \n&quot;</span>, *p1);

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot; p1[0] = 0x%x \n&quot;</span>, p1[<span style="color:#986801">0</span>]);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot; p1[1] = 0x%x \n&quot;</span>, p1[<span style="color:#986801">1</span>]);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot; p1[2] = 0x%x \n&quot;</span>, p1[<span style="color:#986801">2</span>]);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot; p1[3] = 0x%x \n&quot;</span>, p1[<span style="color:#986801">3</span>]);
}
<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span>
 *p  = <span style="color:#986801">0x12345678</span>
 *p1 = <span style="color:#986801">0x78</span>
 p1[<span style="color:#986801">0</span>] = <span style="color:#986801">0x78</span>
 p1[<span style="color:#986801">1</span>] = <span style="color:#986801">0x56</span>
 p1[<span style="color:#986801">2</span>] = <span style="color:#986801">0x34</span>
 p1[<span style="color:#986801">3</span>] = <span style="color:#986801">0x12</span>

Tips：
<span style="color:#986801">1</span>、记住，不管大端还是小端，指针p和p1都是指向低地址。</code></pre>

![原文图解（第 134 页）](assets/figures/p134-51.png)

<p><span style="color:#1456f0">4.2.1.3.2</span> 连续空间类型指针</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#a626a4">struct</span> <span style="color:#4078f2">abc</span> {
    <span style="color:#986801">int</span> a;
    <span style="color:#986801">int</span> b;
    <span style="color:#986801">char</span> c;
};

<span style="color:#986801">int</span> arr[<span style="color:#986801">3</span>] = {<span style="color:#986801">1</span>,<span style="color:#986801">2</span>,<span style="color:#986801">3</span>};

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#a626a4">struct</span> <span style="color:#4078f2">abc</span> data = {
        .a = <span style="color:#986801">1</span>,
        .b = <span style="color:#986801">2</span>,
        .c = <span style="color:#986801">3</span>,
    };
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot; size of struct abc = %ld\n&quot;</span>, <span style="color:#c18401">sizeof</span>(<span style="color:#a626a4">struct</span> abc));

    <span style="color:#a626a4">struct</span> <span style="color:#4078f2">abc</span> *p = &amp;data;
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot; a = %d, b = %d, c = %d\n&quot;</span>, p-&gt;a, p-&gt;b, p-&gt;c);

    <span style="color:#986801">int</span>* p1 = (<span style="color:#986801">int</span> *)&amp;data;
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot; struct p1[0] = %d \n&quot;</span>, p1[<span style="color:#986801">0</span>]);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot; struct p1[1] = %d \n&quot;</span>, p1[<span style="color:#986801">1</span>]);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot; struct p1[2] = %d \n&quot;</span>, p1[<span style="color:#986801">2</span>]);

    <span style="color:#986801">int</span>* p2 = arr;
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot; arr p2[0] = %d \n&quot;</span>, p2[<span style="color:#986801">0</span>]);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot; arr p2[1] = %d \n&quot;</span>, p2[<span style="color:#986801">1</span>]);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot; arr p2[2] = %d \n&quot;</span>, p2[<span style="color:#986801">2</span>]);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span><span style="color:#a0a1a7">：</span>
 a = <span style="color:#986801">1</span>, b = <span style="color:#986801">2</span>, c = <span style="color:#986801">3</span>
 p1[<span style="color:#986801">0</span>] = <span style="color:#986801">1</span>
 p1[<span style="color:#986801">1</span>] = <span style="color:#986801">2</span>
 p1[<span style="color:#986801">2</span>] = <span style="color:#986801">3</span></code></pre>

<pre class="guide-code"><code><span style="color:#a0a1a7">//linux container_of </span><span style="color:#a0a1a7">宏</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">思</span><span style="color:#a0a1a7">想</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> offsetof(TYPE, MEMBER) ((size_t) &amp;((TYPE *)0)-&gt;MEMBER)</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> container_of(ptr, type, member) ({ \</span>
<span style="color:#4078f2">    const typeof( ((type *)0)-&gt;member ) *__mptr = (ptr); \</span>
<span style="color:#4078f2">    (type *)( (char *)__mptr - offsetof(type,member) );})</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#a626a4">struct</span> <span style="color:#4078f2">abc</span> {
    <span style="color:#986801">int</span> a;
    <span style="color:#986801">int</span> b;
    <span style="color:#986801">char</span> c;
};

<span style="color:#986801">void</span> <span style="color:#4078f2">find_struct</span>(<span style="color:#986801">int</span> *member)
{
    <span style="color:#986801">unsigned</span> <span style="color:#986801">long</span> offset = <span style="color:#986801">0</span>;
    <span style="color:#a626a4">struct</span> <span style="color:#4078f2">abc</span>* <span style="color:#4078f2">p</span> = <span style="color:#0184bb">NULL</span>;

    offset = (<span style="color:#986801">unsigned</span> <span style="color:#986801">long</span>)&amp;((<span style="color:#a626a4">struct</span> abc*)<span style="color:#986801">0</span>)-&gt;b;
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot; member offset: %ld \n&quot;</span>, offset);

    p = (<span style="color:#a626a4">struct</span> abc *)((<span style="color:#986801">char</span>*)member - offset);

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot; a:%d, b:%d c: %d \n&quot;</span>, p-&gt;a, p-&gt;b, p-&gt;c);
}

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#a626a4">struct</span> <span style="color:#4078f2">abc</span> <span style="color:#4078f2">data</span> = {
        .a = <span style="color:#986801">1</span>,
        .b = <span style="color:#986801">2</span>,
        .c = <span style="color:#986801">3</span>,
    };
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot; size of struct abc = %ld\n&quot;</span>, <span style="color:#a626a4">sizeof</span>(<span style="color:#a626a4">struct</span> abc));

    <span style="color:#a626a4">struct</span> <span style="color:#4078f2">abc</span> *<span style="color:#4078f2">p</span> = &amp;data;
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot; a = %d, b = %d, c = %d\n&quot;</span>, p-&gt;a, p-&gt;b, p-&gt;c);

    find_struct(&amp;data.b);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}</code></pre>

<p><span style="color:#1456f0">4.2.1.3.3</span> 函数类型指针</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdlib.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;string.h&gt;</span>

<span style="color:#c18401">int</span> (*show)(<span style="color:#986801">const</span> <span style="color:#986801">char</span> *, ...);
<span style="color:#986801">void</span> <span style="color:#4078f2">func</span>(<span style="color:#986801">void</span>)
{
    show = printf;
    <span style="color:#c18401">show</span>(<span style="color:#50a14f">&quot;func call \n&quot;</span>);
}

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">func</span>();
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

tips: 函数指针结合<span style="color:#a626a4">typedef</span>来用，代码更容易读懂：
<span style="color:#a626a4">typedef</span> <span style="color:#4078f2">void</span>(*func)(<span style="color:#986801">void</span>);
func call;<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">定</span><span style="color:#a0a1a7">义一个</span><span style="color:#a0a1a7">指</span><span style="color:#a0a1a7">针</span><span style="color:#a0a1a7">变</span><span style="color:#a0a1a7">量</span>
<span style="color:#c18401">call</span>();<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">调</span><span style="color:#a0a1a7">用</span></code></pre>

<p><span style="color:#1456f0">4.2.1.3.4</span> 指针修改const变量</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> a = <span style="color:#986801">0x12345678</span>;
    <span style="color:#986801">const</span> <span style="color:#986801">int</span> b = <span style="color:#986801">0x11111111</span>;

    <span style="color:#986801">int</span> *p = &amp;a;
    p[<span style="color:#986801">1</span>] = <span style="color:#986801">0x22222222</span>;<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">越</span><span style="color:#a0a1a7">界</span><span style="color:#a0a1a7">访</span><span style="color:#a0a1a7">问</span>

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;a = 0x%x, b = 0x%x \n&quot;</span>,a , b);

    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span><span style="color:#a0a1a7">：</span><span style="color:#a0a1a7">编</span><span style="color:#a0a1a7">译</span><span style="color:#a0a1a7">连</span><span style="color:#a0a1a7">警</span><span style="color:#a0a1a7">告</span><span style="color:#a0a1a7">都</span><span style="color:#a0a1a7">没</span><span style="color:#a0a1a7">有</span>
a = <span style="color:#986801">0x12345678</span>, b = <span style="color:#986801">0x22222222</span></code></pre>

#### 4.2.2 指针运算

##### 4.2.2.1 指针+、-、++、--运算

<p>指针变量本质也是一个变量，所以进行算数运算语法上是可以的。但是实际的工程应用中，指针变量的乘除法没有意义，更多的是加减法。总的来说，+ 运算符用于指针的算术运算，允许将指针移动</p>

<p>到任意偏移位置，而 ++ 运算符是 + 运算符的特例，它递增指针指向的位置，移动一个对象的大小。看一个例子：</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> array[] = {<span style="color:#986801">1</span>, <span style="color:#986801">2</span>, <span style="color:#986801">3</span>, <span style="color:#986801">4</span>, <span style="color:#986801">5</span>};
    <span style="color:#986801">int</span> *p = array;

    p = p + <span style="color:#986801">2</span>;<span style="color:#a0a1a7">//p[2]</span>
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;*p = %d \n&quot;</span>, *p);

    p++;<span style="color:#a0a1a7">//p[3]</span>
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;*p = %d \n&quot;</span>, *p);

    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span>
*p = <span style="color:#986801">3</span>
*p = <span style="color:#986801">4</span></code></pre>

##### 4.2.2.2 指针逻辑运算

<p>逻辑运算中，判断两个指针是否相等比较常用，其他的不常用。另外，只有两个相同类型的指针比较才有意义，一般编译也会包警告，如果类型不同。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdlib.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> *p = (<span style="color:#986801">int</span>*)<span style="color:#c18401">malloc</span>(<span style="color:#c18401">sizeof</span>(<span style="color:#986801">int</span>));
    <span style="color:#a626a4">if</span> (p == <span style="color:#0184bb">NULL</span>) {
        <span style="color:#a626a4">return</span> <span style="color:#986801">-1</span>;
    }

    <span style="color:#986801">char</span> *p1 = <span style="color:#0184bb">NULL</span>;
    <span style="color:#a626a4">if</span> (p1 == p) { <span style="color:#a0a1a7">// warning</span>
        <span style="color:#a0a1a7">//do something</span>
    }
    <span style="color:#c18401">free</span>(p);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span>
<span style="color:#986801">1.</span>c: In function ‘main’:
<span style="color:#986801">1.</span>c:<span style="color:#986801">12</span>:<span style="color:#986801">12</span>: warning: comparison of distinct pointer types lacks a cast
   <span style="color:#986801">12</span> |     <span style="color:#a626a4">if</span> (p1 == p) {
      |</code></pre>

<pre class="guide-code"><code><span style="color:#646a73">#</span><span style="color:#646a73">参</span><span style="color:#646a73">考</span><span style="color:#646a73">linux</span><span style="color:#646a73">下</span><span style="color:#646a73">MAX</span><span style="color:#646a73">的</span><span style="color:#646a73">实</span><span style="color:#646a73">现</span><span style="color:#646a73">(3.18</span><span style="color:#646a73">内</span><span style="color:#646a73">核</span><span style="color:#646a73">)</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> MAX(x, y) ({                      \</span>
<span style="color:#4078f2">        typeof(x) _max1 = (x);            \</span>
<span style="color:#4078f2">        typeof(y) _max2 = (y);            \</span>
<span style="color:#4078f2">        </span><span style="color:#d83931">(void) (&amp;_max1 == &amp;_max2);        \</span>
<span style="color:#4078f2">        _max1 &gt; _max2 ? _max1 : _max2; })</span></code></pre>

#### 4.2.3 多级指针

<p>多级指针本质上也是一个指针，也需要一个指针变量来存放。这个指针变量的内存大小跟一级指针一样，跟系统有关。</p>

<pre class="guide-code"><code><span style="color:#986801">int</span> **p

<span style="color:#986801">1.</span> <span style="color:#d83931">*</span>p<span style="color:#d83931"> </span>第一<span style="color:#50a14f">&quot;*&quot;</span> 决定 变量p 是一个指针变量
<span style="color:#986801">2.</span> <span style="color:#d83931">*</span>*p 第二<span style="color:#50a14f">&quot;*&quot;</span> 决定 指针p 访问内存规则是以 <span style="color:#d83931">指</span><span style="color:#d83931">针</span><span style="color:#d83931">类</span><span style="color:#d83931">型</span><span style="color:#d83931"> </span>进行访问，所以*p的值还是一个指针(地
址)
<span style="color:#986801">3.</span> <span style="color:#986801">int</span> 决定 指针(*p) 访问内存规则是以 <span style="color:#d83931">int</span><span style="color:#d83931">类</span><span style="color:#d83931">型</span> 进行访问，所以 *(*p) 是 <span style="color:#986801">int</span>类型</code></pre>

![原文图解（第 139 页）](assets/figures/p139-38.png)

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdlib.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> a = <span style="color:#986801">100</span>;
    <span style="color:#986801">int</span> *p = &amp;a;
    <span style="color:#986801">int</span> **pp = &amp;p;

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;**pp = %d, *pp[0] = %d \n&quot;</span>,**pp, *pp[<span style="color:#986801">0</span>]);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;size of pp %ld \n&quot;</span>, <span style="color:#c18401">sizeof</span>(pp));
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}</code></pre>

<pre class="guide-code"><code><span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span>
**pp = <span style="color:#986801">100</span>, *pp[<span style="color:#986801">0</span>] = <span style="color:#986801">100</span> <span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">建</span><span style="color:#a0a1a7">议</span><span style="color:#a0a1a7">用</span><span style="color:#a0a1a7">*pp[]</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">方</span><span style="color:#a0a1a7">式</span><span style="color:#a0a1a7">访</span><span style="color:#a0a1a7">问</span>
size of pp <span style="color:#986801">8</span></code></pre>

<p>用于指针变量地址传递</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdlib.h&gt;</span>

<span style="color:#986801">void</span> <span style="color:#4078f2">func1</span>(<span style="color:#986801">char</span> * s)
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;func1: %s \n&quot;</span>, s);

    s = <span style="color:#50a14f">&quot;hello linux&quot;</span>;
}

<span style="color:#986801">void</span> <span style="color:#4078f2">func2</span>(<span style="color:#986801">char</span> **s)
{
    *s = <span style="color:#50a14f">&quot;hello linux&quot;</span>;
}

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">char</span> * s = <span style="color:#50a14f">&quot;hello world&quot;</span>;

    <span style="color:#c18401">func1</span>(s);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;s1 = %s \n&quot;</span>, s);

    <span style="color:#c18401">func2</span>(&amp;s);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;s2 = %s \n&quot;</span>, s);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span>
func1: hello world
s1 = hello world
s2 = hello linux</code></pre>

<p>多级指针用于<span style="color:#d83931">物</span><span style="color:#d83931">理</span><span style="color:#d83931">无</span><span style="color:#d83931">序</span>映射到<span style="color:#d83931">逻</span><span style="color:#d83931">辑</span><span style="color:#d83931">有</span><span style="color:#d83931">序</span>的数据结构设计：</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdlib.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">char</span> *arr[<span style="color:#986801">3</span>] = {<span style="color:#50a14f">&quot;welcome&quot;</span>, <span style="color:#50a14f">&quot;to&quot;</span>, <span style="color:#50a14f">&quot;linux&quot;</span>};
    <span style="color:#986801">char</span> **s = arr;

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%s:%p\n&quot;</span>,s[<span style="color:#986801">0</span>], s[<span style="color:#986801">0</span>]);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%s:%p\n&quot;</span>,s[<span style="color:#986801">1</span>], s[<span style="color:#986801">1</span>]);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%s:%p\n&quot;</span>,s[<span style="color:#986801">2</span>], s[<span style="color:#986801">3</span>]);

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;&amp;s[0]:%p\n&quot;</span>,&amp;s[<span style="color:#986801">0</span>]);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;&amp;s[1]:%p\n&quot;</span>,&amp;s[<span style="color:#986801">1</span>]);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;&amp;s[2]:%p\n&quot;</span>,&amp;s[<span style="color:#986801">2</span>]);

    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span>
welcome:<span style="color:#986801">0x5557a265a004</span>
to:<span style="color:#986801">0x5557a265a00c</span>
linux:<span style="color:#986801">0x75e4a3ccff45c900</span>
&amp;s[<span style="color:#986801">0</span>]:<span style="color:#986801">0x7ffd01eaeb80</span>
&amp;s[<span style="color:#986801">1</span>]:<span style="color:#986801">0x7ffd01eaeb88</span>
&amp;s[<span style="color:#986801">2</span>]:<span style="color:#986801">0x7ffd01eaeb90</span></code></pre>

![原文图解（第 142 页）](assets/figures/p142-00.png)

### 4.3 数组

<p>数组本质上不算是一个新的数据类型，而是一种用于存储相同类型数据元素的数据结构。数组中的每个元素都有唯一的索引（位置），通过索引可以访问和操作数组中的元素。</p>

![原文图解（第 142 页）](assets/figures/p142-04.png)

#### 4.3.1 数组的定义

<p>数组定义需要回答：分配多少空间？读取的方式是什么？</p>

<pre class="guide-code"><code>数据类型 数组名[n] ：<span style="color:#986801">int</span> array[<span style="color:#986801">10</span>]

tips:
n的作用域是在申请空间的时候生效，代表圈定了n*<span style="color:#4078f2">sizeof</span>(数据类型)字节的空间

<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> arr[<span style="color:#986801">5</span>] = {<span style="color:#986801">1</span>,<span style="color:#986801">2</span>,<span style="color:#986801">3</span>,<span style="color:#986801">4</span>,<span style="color:#986801">5</span>};
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;size of arr is: %ld byte</span><span style="color:#50a14f">，</span><span style="color:#50a14f">len is %ld \n&quot;</span>, <span style="color:#c18401">sizeof</span>(arr),
        <span style="color:#2ea121">sizeof</span><span style="color:#646a73">(arr) / </span><span style="color:#2ea121">sizeof</span><span style="color:#646a73">(arr[0])</span>);

    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}
<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span><span style="color:#a0a1a7">：</span>
size of arr is: <span style="color:#986801">40</span> byte，len is <span style="color:#986801">10</span></code></pre>

##### 4.3.1.1 数组名的本质

<p>数组名是一个常量标签（类似函数名），所以数组名不能做左值，是圈定的内存的别名。数组名的值是<span style="color:#d83931">地址</span><span style="color:#d83931">常</span><span style="color:#d83931">量</span><span style="color:#d83931">（</span><span style="color:#d83931">指</span><span style="color:#d83931">针</span><span style="color:#d83931">常</span><span style="color:#d83931">量</span><span style="color:#d83931">）</span>，是一个地址编号，指向数组的首元素。</p>

![原文图解（第 143 页）](assets/figures/p143-28.png)

<p>数组名是常量标签</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdlib.h&gt;</span>
<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">char</span> arr[<span style="color:#986801">20</span>];
    arr = <span style="color:#50a14f">&quot;hello wolrd&quot;</span>;<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">编</span><span style="color:#a0a1a7">译</span><span style="color:#a0a1a7">报</span><span style="color:#a0a1a7">错</span>

    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#986801">1.</span>c: In function ‘main’:
<span style="color:#986801">1.</span>c:<span style="color:#986801">7</span>:<span style="color:#986801">9</span>: error: assignment to expression with array type
    <span style="color:#986801">7</span> |     arr = <span style="color:#50a14f">&quot;hello wolrd&quot;</span>;
      |

Tips：啥是指针常量？假设<span style="color:#986801">0x12345678</span>合法，则（<span style="color:#986801">int</span>*）<span style="color:#986801">0x12345678</span> 就是一个指针常量，指针常量
当然不能被赋值：（<span style="color:#986801">int</span>*）<span style="color:#986801">0x12345678</span> = <span style="color:#986801">123</span>; <span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">不</span><span style="color:#a0a1a7">符</span><span style="color:#a0a1a7">合</span><span style="color:#a0a1a7">语</span><span style="color:#a0a1a7">法</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">类</span><span style="color:#a0a1a7">似</span><span style="color:#a0a1a7">（</span><span style="color:#a0a1a7">int</span><span style="color:#a0a1a7">）</span><span style="color:#a0a1a7">123 = 456</span><span style="color:#a0a1a7">；</span><span style="color:#a0a1a7">一</span><span style="color:#a0a1a7">样</span></code></pre>

<p>arr 和 &amp;arr 的区别</p>

<p>arr的值和&amp;arr值一样，但是意义不同：arr的值是指向数组的首元素的<span style="color:#d83931">地址</span><span style="color:#d83931">常</span><span style="color:#d83931">量</span><span style="color:#d83931">（</span><span style="color:#d83931">指</span><span style="color:#d83931">针</span><span style="color:#d83931">常</span><span style="color:#d83931">量</span><span style="color:#d83931">），</span>&amp;arr的值是指向整片数组内存的<span style="color:#d83931">地址</span><span style="color:#d83931">常</span><span style="color:#d83931">量</span><span style="color:#d83931">（</span><span style="color:#d83931">指</span><span style="color:#d83931">针</span><span style="color:#d83931">常</span><span style="color:#d83931">量</span><span style="color:#d83931">）</span><span style="color:#d83931">。</span>所以都是指针常量，但是指针读取内存规则不一样。</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdlib.h&gt;</span>

<span style="color:#986801">char</span> arr[<span style="color:#986801">12</span>];
<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;arr      = %d\n&quot;</span>, arr);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;&amp;arr     = %d\n&quot;</span>, &amp;arr);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;size of arr is: %ld\n&quot;</span>, <span style="color:#c18401">sizeof</span>(arr));
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;arr + 1  = %d\n&quot;</span>, arr + <span style="color:#986801">1</span>);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;&amp;arr + 1 = %d\n&quot;</span>, &amp;arr + <span style="color:#986801">1</span>);

    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span>
arr      = <span style="color:#986801">738533400</span>
&amp;arr     = <span style="color:#986801">738533400</span>
size of arr is: <span style="color:#986801">12</span>
arr + <span style="color:#986801">1</span>  = <span style="color:#986801">738533401</span>
&amp;arr + <span style="color:#986801">1</span> = <span style="color:#986801">738533412</span></code></pre>

##### 4.3.1.2 一维数组的访问

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdlib.h&gt;</span>
<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">char</span> arr[<span style="color:#986801">12</span>] = <span style="color:#50a14f">&quot;hello world&quot;</span>;

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%c \n&quot;</span>, arr[<span style="color:#986801">4</span>]);
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%c \n&quot;</span>, *(arr+<span style="color:#986801">4</span>));

    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span>
o
o</code></pre>

##### 4.3.1.3 二维数组的访问

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>()
{
    <span style="color:#986801">int</span> arr[<span style="color:#986801">3</span>][<span style="color:#986801">5</span>] = {{<span style="color:#986801">1</span>, <span style="color:#986801">2</span>, <span style="color:#986801">3</span>, <span style="color:#986801">4</span>, <span style="color:#986801">5</span>}, {<span style="color:#986801">6</span>, <span style="color:#986801">7</span>, <span style="color:#986801">8</span>, <span style="color:#986801">9</span>, <span style="color:#986801">10</span>}, {<span style="color:#986801">11</span>, <span style="color:#986801">12</span>, <span style="color:#986801">13</span>, <span style="color:#986801">14</span>, <span style="color:#986801">15</span>}};

    <span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">打</span><span style="color:#a0a1a7">印</span><span style="color:#a0a1a7">数</span><span style="color:#a0a1a7">组</span><span style="color:#a0a1a7">指</span><span style="color:#a0a1a7">针</span><span style="color:#a0a1a7">指</span><span style="color:#a0a1a7">向</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">数</span><span style="color:#a0a1a7">组</span><span style="color:#a0a1a7">中</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">元</span><span style="color:#a0a1a7">素</span>
    <span style="color:#a626a4">for</span> (<span style="color:#986801">int</span> i = <span style="color:#986801">0</span>; i &lt; <span style="color:#986801">3</span>; i++) {
        <span style="color:#a626a4">for</span> (<span style="color:#986801">int</span> j = <span style="color:#986801">0</span>; j &lt; <span style="color:#986801">5</span>; j++) {
            <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%d &quot;</span>, arr[i][j]);
        }
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;\n&quot;</span>);
    }
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%p %p %d\n&quot;</span>, arr, *arr, **arr);
    <span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">打</span><span style="color:#a0a1a7">印</span><span style="color:#a0a1a7">数</span><span style="color:#a0a1a7">组</span><span style="color:#a0a1a7">指</span><span style="color:#a0a1a7">针</span><span style="color:#a0a1a7">指</span><span style="color:#a0a1a7">向</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">数</span><span style="color:#a0a1a7">组</span><span style="color:#a0a1a7">中</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">元</span><span style="color:#a0a1a7">素</span>
    <span style="color:#a626a4">for</span> (<span style="color:#986801">int</span> i = <span style="color:#986801">0</span>; i &lt; <span style="color:#986801">3</span>; i++) {
        <span style="color:#a626a4">for</span> (<span style="color:#986801">int</span> j = <span style="color:#986801">0</span>; j &lt; <span style="color:#986801">5</span>; j++) {
            <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%d &quot;</span>, *(*(arr+i)+j));
        }
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;\n&quot;</span>);
    }

    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}</code></pre>

<pre class="guide-code"><code><span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">运</span><span style="color:#a0a1a7">行</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span>
<span style="color:#986801">1</span> <span style="color:#986801">2</span> <span style="color:#986801">3</span> <span style="color:#986801">4</span> <span style="color:#986801">5</span>
<span style="color:#986801">6</span> <span style="color:#986801">7</span> <span style="color:#986801">8</span> <span style="color:#986801">9</span> <span style="color:#986801">10</span>
<span style="color:#986801">11</span> <span style="color:#986801">12</span> <span style="color:#986801">13</span> <span style="color:#986801">14</span> <span style="color:#986801">15</span>

<span style="color:#986801">0x7ffc6fb525d0</span> <span style="color:#986801">0x7ffc6fb525d0</span> <span style="color:#986801">1</span>

<span style="color:#986801">1</span> <span style="color:#986801">2</span> <span style="color:#986801">3</span> <span style="color:#986801">4</span> <span style="color:#986801">5</span>
<span style="color:#986801">6</span> <span style="color:#986801">7</span> <span style="color:#986801">8</span> <span style="color:#986801">9</span> <span style="color:#986801">10</span>
<span style="color:#986801">11</span> <span style="color:#986801">12</span> <span style="color:#986801">13</span> <span style="color:#986801">14</span> <span style="color:#986801">15</span></code></pre>

#### 4.3.2 数组与指针

##### 4.3.2.1 数组与指针区别

<p>数组和指针本质上都可以代表一个连续的空间。只是数组名是这段连续空间的标签（指针常量），而指针需要一个指针变量来存放。在访问内存时，数组名和指针可以画等号。</p>

![原文图解（第 146 页）](assets/figures/p146-16.png)

##### 4.3.2.2 指针数组与数组指针

<p>指针数组：指针数组是一个数组，其中的每个元素都是一个指针。</p>

<p>示例： int *array[3]; 声明了一个包含3个元素的指针数组，每个元素都是一个指向整数的指针。</p>

<p>用途： 指针数组常用于存储一组指针，每个指针可以指向不同类型的数据或不同位置的数组。</p>

<pre class="guide-code"><code><span style="color:#986801">int</span> <span style="color:#4078f2">main</span>()
{
    <span style="color:#986801">int</span> a = <span style="color:#986801">1</span>, b = <span style="color:#986801">2</span>, c = <span style="color:#986801">3</span>;
    <span style="color:#986801">int</span> *array[<span style="color:#986801">3</span>] = {&amp;a, &amp;b, &amp;c};
    <span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">打</span><span style="color:#a0a1a7">印</span><span style="color:#a0a1a7">指</span><span style="color:#a0a1a7">针</span><span style="color:#a0a1a7">数</span><span style="color:#a0a1a7">组</span><span style="color:#a0a1a7">中</span><span style="color:#a0a1a7">每</span><span style="color:#a0a1a7">个</span><span style="color:#a0a1a7">元</span><span style="color:#a0a1a7">素</span><span style="color:#a0a1a7">指</span><span style="color:#a0a1a7">向</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">值</span>
    <span style="color:#a626a4">for</span> (<span style="color:#986801">int</span> i = <span style="color:#986801">0</span>; i &lt; <span style="color:#986801">3</span>; i++) {
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%d &quot;</span>, *array[i]);
    }

    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}</code></pre>

<p>数组指针：数组指针是一个指针，它指向一个数组</p>

<p>示例： int (*ptr)[3]; 声明了一个指针，指向包含3个元素的整数数组</p>

<p>用途： 数组指针常用于处理二维数组或作为指向动态分配数组的指针</p>

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>()
{
    <span style="color:#986801">int</span> arr[<span style="color:#986801">3</span>][<span style="color:#986801">5</span>] = {{<span style="color:#986801">1</span>, <span style="color:#986801">2</span>, <span style="color:#986801">3</span>, <span style="color:#986801">4</span>, <span style="color:#986801">5</span>}, {<span style="color:#986801">6</span>, <span style="color:#986801">7</span>, <span style="color:#986801">8</span>, <span style="color:#986801">9</span>, <span style="color:#986801">10</span>}, {<span style="color:#986801">11</span>, <span style="color:#986801">12</span>, <span style="color:#986801">13</span>, <span style="color:#986801">14</span>, <span style="color:#986801">15</span>}};
    <span style="color:#c18401">int</span> (*p)[<span style="color:#986801">5</span>] = arr;

    <span style="color:#a0a1a7">// </span><span style="color:#a0a1a7">打</span><span style="color:#a0a1a7">印</span><span style="color:#a0a1a7">数</span><span style="color:#a0a1a7">组</span><span style="color:#a0a1a7">指</span><span style="color:#a0a1a7">针</span><span style="color:#a0a1a7">指</span><span style="color:#a0a1a7">向</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">数</span><span style="color:#a0a1a7">组</span><span style="color:#a0a1a7">中</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">元</span><span style="color:#a0a1a7">素</span>
    <span style="color:#a626a4">for</span> (<span style="color:#986801">int</span> i = <span style="color:#986801">0</span>; i &lt; <span style="color:#986801">3</span>; i++) {
        <span style="color:#a626a4">for</span> (<span style="color:#986801">int</span> j = <span style="color:#986801">0</span>; j &lt; <span style="color:#986801">5</span>; j++) {
            <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;%d &quot;</span>, p[i][j]);
        }
        <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;\n&quot;</span>);
    }

    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}</code></pre>

##### 4.3.2.3 二维数组和二级指针的关系

<p>先说结论：没有关系。二维数组本质上是一段连续空间的圈定，跟二级指针在概念上就不是一个维度，无法比较。但二维数组名是一个<span style="color:#d83931">二</span><span style="color:#d83931">级</span><span style="color:#d83931">指</span><span style="color:#d83931">针</span><span style="color:#d83931">常</span><span style="color:#d83931">量</span><span style="color:#d83931">。</span><span style="color:#d83931">在</span><span style="color:#d83931">内</span><span style="color:#d83931">存</span><span style="color:#d83931">访</span><span style="color:#d83931">问</span><span style="color:#d83931">时</span><span style="color:#d83931">，</span><span style="color:#d83931">二</span><span style="color:#d83931">维</span><span style="color:#d83931">数</span><span style="color:#d83931">组</span><span style="color:#d83931">名和</span><span style="color:#d83931">二</span><span style="color:#d83931">级</span><span style="color:#d83931">指</span><span style="color:#d83931">针</span><span style="color:#d83931">可</span><span style="color:#d83931">以</span><span style="color:#d83931">画</span><span style="color:#d83931">等</span><span style="color:#d83931">号</span><span style="color:#d83931">。</span></p>

![原文图解（第 148 页）](assets/figures/p148-00.png)

## 5. 常见面试题

### 5.1 预处理-#define

<pre class="guide-code"><code><span style="color:#646a73">Q: </span><span style="color:#646a73">用</span><span style="color:#646a73">预</span><span style="color:#646a73">处</span><span style="color:#646a73">理</span><span style="color:#646a73">指</span><span style="color:#646a73">令</span><span style="color:#646a73">#define</span><span style="color:#646a73">声</span><span style="color:#646a73">明</span><span style="color:#646a73">一个</span><span style="color:#646a73">常</span><span style="color:#646a73">数</span><span style="color:#646a73">，</span><span style="color:#646a73">用</span><span style="color:#646a73">以</span><span style="color:#646a73">表</span><span style="color:#646a73">明</span><span style="color:#646a73">1</span><span style="color:#646a73">年</span><span style="color:#646a73">中</span><span style="color:#646a73">有</span><span style="color:#646a73">多</span><span style="color:#646a73">少</span><span style="color:#646a73">秒</span><span style="color:#646a73">(</span><span style="color:#646a73">忽</span><span style="color:#646a73">略</span><span style="color:#646a73">闰</span><span style="color:#646a73">年</span><span style="color:#646a73">问</span><span style="color:#646a73">题</span><span style="color:#646a73">)</span>

<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> </span><span style="color:#4078f2">宏</span><span style="color:#4078f2">名</span><span style="color:#4078f2"> </span><span style="color:#4078f2">宏</span><span style="color:#4078f2">体</span>
宏名：大写字母表示

<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> SECOND_OF_YEAR </span><span style="color:#4078f2">（</span><span style="color:#4078f2">365 * 24 * 3600</span><span style="color:#4078f2">）</span><span style="color:#4078f2">UL</span>

L表示长整型<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">因</span><span style="color:#a0a1a7">为</span><span style="color:#a0a1a7">可</span><span style="color:#a0a1a7">能</span><span style="color:#a0a1a7">CPU</span><span style="color:#a0a1a7">位</span><span style="color:#a0a1a7">数</span><span style="color:#a0a1a7">不一</span><span style="color:#a0a1a7">样</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">至</span><span style="color:#a0a1a7">少</span><span style="color:#a0a1a7">保</span><span style="color:#a0a1a7">证</span><span style="color:#a0a1a7">为</span><span style="color:#a0a1a7">4</span><span style="color:#a0a1a7">字</span><span style="color:#a0a1a7">节</span>
U表示无符号

<span style="color:#986801">int</span> a = SECOND_OF_YEAR;<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">编</span><span style="color:#a0a1a7">译</span><span style="color:#a0a1a7">阶</span><span style="color:#a0a1a7">段</span><span style="color:#a0a1a7">已</span><span style="color:#a0a1a7">经</span><span style="color:#a0a1a7">处</span><span style="color:#a0a1a7">理</span><span style="color:#a0a1a7">为</span><span style="color:#a0a1a7">常</span><span style="color:#a0a1a7">数</span>

<span style="color:#986801">1</span>、<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2">语</span><span style="color:#4078f2">法</span><span style="color:#4078f2">的</span><span style="color:#4078f2">基</span><span style="color:#4078f2">本</span><span style="color:#4078f2">知</span><span style="color:#4078f2">识</span><span style="color:#4078f2">（</span><span style="color:#4078f2">例</span><span style="color:#4078f2">如</span><span style="color:#4078f2">：</span><span style="color:#4078f2">不</span><span style="color:#4078f2">能</span><span style="color:#4078f2">以</span><span style="color:#4078f2">分</span><span style="color:#4078f2">号</span><span style="color:#4078f2">结</span><span style="color:#4078f2">束</span><span style="color:#4078f2">、</span><span style="color:#4078f2">括</span><span style="color:#4078f2">号</span><span style="color:#4078f2">的</span><span style="color:#4078f2">使</span><span style="color:#4078f2">用</span><span style="color:#4078f2">，</span><span style="color:#4078f2">等等</span><span style="color:#4078f2">）</span>
<span style="color:#986801">2</span>、懂得预处理器将为你计算常数表达式的值，因此，直接写出你是如何计算一年中有多少秒而不是计算
出实际的值，是更清晰而没有代价的。
<span style="color:#986801">3</span>、意识到这个表达式将使一个<span style="color:#986801">16</span>位机的整型数溢出，因此要用到长整型符号L，告诉编译器这个常数是
的长整型数。
<span style="color:#986801">4</span>、如果你在你的表达式中用到UL（表示无符号长整型）.
<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">嵌</span><span style="color:#a0a1a7">入</span><span style="color:#a0a1a7">式</span><span style="color:#a0a1a7">程</span><span style="color:#a0a1a7">序</span><span style="color:#a0a1a7">员</span><span style="color:#a0a1a7">面</span><span style="color:#a0a1a7">试</span><span style="color:#a0a1a7">题</span><span style="color:#a0a1a7">: </span><span style="color:#a0a1a7">下</span><span style="color:#a0a1a7">面</span><span style="color:#a0a1a7">这</span><span style="color:#a0a1a7">个</span><span style="color:#a0a1a7">MIN</span><span style="color:#a0a1a7">宏</span><span style="color:#a0a1a7">有</span><span style="color:#a0a1a7">哪</span><span style="color:#a0a1a7">些</span><span style="color:#a0a1a7">问</span><span style="color:#a0a1a7">题</span><span style="color:#a0a1a7">?</span>
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> MIN(A,B) A &lt;= B ? A : B</span>
问题<span style="color:#986801">1</span>：<span style="color:#986801">3</span> * <span style="color:#c18401">MIN2</span>(<span style="color:#986801">10</span>, <span style="color:#986801">20</span>) 结果不符合预期
解决方案：<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> MIN(A,B) (A &lt;= B ? A : B)</span>

问题<span style="color:#986801">2</span>：<span style="color:#c18401">MIN2</span>(<span style="color:#986801">10</span>, <span style="color:#986801">20</span> &lt; <span style="color:#986801">30</span>? <span style="color:#986801">20</span> : <span style="color:#986801">30</span>)结果不符合预期
解决方案：
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> MIN(A,B) ((A) &lt;= (B) ? (A) : (B))</span>

问题<span style="color:#986801">3</span>：<span style="color:#c18401">MIN2</span>(a++, <span style="color:#986801">20</span> &lt; <span style="color:#986801">30</span>? <span style="color:#986801">20</span> : <span style="color:#986801">30</span>)结果不符合预期
解决方案：
<span style="color:#4078f2">#</span><span style="color:#a626a4">define</span><span style="color:#4078f2"> MIN(A,B) ({ \</span>
<span style="color:#4078f2">    typeof(A) _min1 = (A); \</span>
<span style="color:#4078f2">    typeof(B) _min2 = (B); \</span>
<span style="color:#4078f2">    _min1 &lt; _min2 ? _min1 : _min2;\</span>
<span style="color:#4078f2">})</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">int</span> a = <span style="color:#986801">10</span>;

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;    min = %d \n&quot;</span>, <span style="color:#986801">3</span> * <span style="color:#c18401">MIN</span>(a++, <span style="color:#986801">20</span> &lt; <span style="color:#986801">30</span>? <span style="color:#986801">20</span> : <span style="color:#986801">30</span>));
    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;    a = %d \n&quot;</span>, a);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}</code></pre>

### 5.2 修饰符-const

<pre class="guide-code"><code>C:只读，建议性，不具备强制性 !=常量
<span style="color:#986801">const</span>意味着“只读”
<span style="color:#986801">const</span> <span style="color:#986801">int</span> a = <span style="color:#986801">100</span>; <span style="color:#a0a1a7">// a</span><span style="color:#a0a1a7">是</span><span style="color:#a0a1a7">变</span><span style="color:#a0a1a7">量</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">尽</span><span style="color:#a0a1a7">量</span><span style="color:#a0a1a7">保</span><span style="color:#a0a1a7">持</span><span style="color:#a0a1a7">100</span><span style="color:#a0a1a7">不</span><span style="color:#a0a1a7">变</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">可</span><span style="color:#a0a1a7">通过</span><span style="color:#a0a1a7">指</span><span style="color:#a0a1a7">针</span><span style="color:#a0a1a7">修</span><span style="color:#a0a1a7">改</span>

<span style="color:#986801">const</span> <span style="color:#986801">int</span> a;
<span style="color:#986801">int</span> <span style="color:#986801">const</span> a;
前两个的作用是一样，a是一个常整型数。

<span style="color:#986801">const</span> <span style="color:#986801">int</span> *a;
意味着a是一个指向常整型数的指针（也就是，整型数是不可修改的，但指针可以）。

<span style="color:#986801">int</span> * <span style="color:#986801">const</span> a;
a是一个指向整型数的常指针（也就是说，指针指向的整型数是可以修改的，但指针是不可修改的）。

<span style="color:#986801">int</span> <span style="color:#986801">const</span> * <span style="color:#986801">const</span> a;
a是一个指向常整型数的常指针（也就是说，指针指向的整型数是不可修改的，同时指针也是不可修改
的）。
合理地使用关键字<span style="color:#986801">const</span>可以使编译器很自然地保护那些不希望被改变的参数，防止其被无意的代码修
改。简而言之，这样可以减少bug的出现。</code></pre>

### 5.3 signed与unsigned隐式转换

<pre class="guide-code"><code><span style="color:#4078f2">#</span><span style="color:#a626a4">include</span><span style="color:#4078f2"> </span><span style="color:#50a14f">&lt;stdio.h&gt;</span>
<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">嵌</span><span style="color:#a0a1a7">入</span><span style="color:#a0a1a7">式</span><span style="color:#a0a1a7">程</span><span style="color:#a0a1a7">序</span><span style="color:#a0a1a7">员</span><span style="color:#a0a1a7">面</span><span style="color:#a0a1a7">试</span><span style="color:#a0a1a7">题</span><span style="color:#a0a1a7">：</span><span style="color:#a0a1a7">下</span><span style="color:#a0a1a7">面</span><span style="color:#a0a1a7">的</span><span style="color:#a0a1a7">代</span><span style="color:#a0a1a7">码</span><span style="color:#a0a1a7">输</span><span style="color:#a0a1a7">出</span><span style="color:#a0a1a7">是</span><span style="color:#a0a1a7">什么</span><span style="color:#a0a1a7">，</span><span style="color:#a0a1a7">为什么</span><span style="color:#a0a1a7">？</span>

<span style="color:#986801">int</span> <span style="color:#4078f2">main</span>(<span style="color:#986801">void</span>)
{
    <span style="color:#986801">unsigned</span> <span style="color:#986801">int</span> a = <span style="color:#986801">9</span>;
    <span style="color:#986801">int</span> b = <span style="color:#986801">-10</span>;

    <span style="color:#c18401">printf</span>(<span style="color:#50a14f">&quot;    a+b = %d \n&quot;</span>, a+b);
    (b+a &gt; <span style="color:#986801">0</span>) ?
        <span style="color:#c18401">puts</span>(<span style="color:#50a14f">&quot;    a+b &gt; 0&quot;</span>):
        <span style="color:#c18401">puts</span>(<span style="color:#50a14f">&quot;    a+b &lt;= 0&quot;</span>);
    <span style="color:#a626a4">return</span> <span style="color:#986801">0</span>;
}

<span style="color:#a0a1a7">//</span><span style="color:#a0a1a7">输</span><span style="color:#a0a1a7">出</span><span style="color:#a0a1a7">结</span><span style="color:#a0a1a7">果</span>
    a+b = <span style="color:#986801">-1</span>
    a+b &gt; <span style="color:#986801">0</span></code></pre>

### 5.4 复杂类型定义

<p>右左原则。</p>

<pre class="guide-code"><code><span style="color:#646a73">Q:</span><span style="color:#646a73">用</span><span style="color:#646a73">变</span><span style="color:#646a73">量</span><span style="color:#646a73">a</span><span style="color:#646a73">给</span><span style="color:#646a73">出</span><span style="color:#646a73">下</span><span style="color:#646a73">面</span><span style="color:#646a73">的</span><span style="color:#646a73">定</span><span style="color:#646a73">义</span>

<span style="color:#986801">1.</span> 一个整型数（An integer）；

<span style="color:#986801">int</span> a;

<span style="color:#986801">2.</span> 一个指向整型数的指针（A pointer to an integer）；

<span style="color:#986801">int</span> *a;

<span style="color:#986801">3.</span> 一个指向指针的指针，它指向的指针是指向一个整型数（A pointer to a pointer to an
integer）；

<span style="color:#986801">int</span> **a;
<span style="color:#986801">4.</span> 一个有<span style="color:#986801">10</span>个整型数的数组（An array of <span style="color:#986801">10</span> integers）；

<span style="color:#986801">int</span> a[<span style="color:#986801">10</span>];

<span style="color:#986801">5.</span> 一个有<span style="color:#986801">10</span>个指针的数组，该指针是指向一个整型数的（An array of <span style="color:#986801">10</span> pointers to
integers）；

<span style="color:#986801">int</span> *a[<span style="color:#986801">10</span>];

<span style="color:#986801">6.</span> 一个指向有<span style="color:#986801">10</span>个整型数数组的指针（A pointer to an array of <span style="color:#986801">10</span> integers）；

<span style="color:#c18401">int</span> (*a)[<span style="color:#986801">10</span>];

<span style="color:#986801">7.</span> 一个指向函数的指针，该函数有一个整型参数并返回一个整型数（A pointer to a function
that takes an integer as an argument <span style="color:#a626a4">and</span> returns an integer）；

<span style="color:#c18401">int</span> (*a)(<span style="color:#986801">int</span>)

<span style="color:#986801">8.</span> 一个有<span style="color:#986801">10</span>个指针的数组，该指针指向一个函数，该函数有一个整型参数并返回一个整型数（ An
array of ten pointers to functions that take an integer argument <span style="color:#a626a4">and</span> <span style="color:#a626a4">return</span> an
integer ）

<span style="color:#c18401">int</span> (*a[<span style="color:#986801">10</span>]) (<span style="color:#986801">int</span>)</code></pre>

## 6. 附录

### 6.1 推荐的学习网站

<p><span style="color:#336df4">https://c-cpp.com/c/language</span></p>

<p><span style="color:#336df4">https://www.geeksforgeeks.org/c-programming-language/?ref=gcse_ind</span></p>

### 6.2 ASCII码表

![原文图解（第 152 页）](assets/figures/p152-00.png)

![原文图解（第 152 页）](assets/figures/p152-01.png)

![原文图解（第 153 页）](assets/figures/p153-00.png)
