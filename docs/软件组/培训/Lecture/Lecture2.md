# C 语言第一次培训 —— Lecture 2

面向新队员的第二次课：**从 Hello World 开始，把 C 语言的基础件全部过一遍**——程序结构、基本语法、数据类型、二进制与进制转换、函数、标准输入输出。

本页内嵌的是可交互课件：课件里的步骤条、折叠问答、选项卡都能点开查看细节，随堂小测点选后会给解析，也可以用键盘翻页；课件中所有技术名词都带了可点击的超链接，方便当场查资料。

---

## 课件

<!-- 注意：本页 URL 是 …/Lecture/Lecture2/（目录型），所以课件要写 ../slides/…；
     删掉 ../ 会变成 …/Lecture2/slides/… → 课件 404。 -->

<div style="border:1px solid var(--md-default-fg-color--lightest);border-radius:8px;overflow:hidden;background:#fff">
  <iframe
    src="../slides/lecture2/index.html"
    title="C 语言第一次培训 —— Lecture 2（交互式课件）"
    style="display:block;width:100%;aspect-ratio:16/10;border:0"
    allowfullscreen
    loading="lazy"
    onclick="this.contentWindow.focus()"></iframe>
</div>

<a href="../slides/lecture2/index.html" target="_blank" rel="noopener">全屏打开课件</a>

> **操作提示**：先点击课件区域（让键盘焦点进入课件），再用 <kbd>←</kbd> <kbd>→</kbd> / <kbd>空格</kbd> 翻页；<kbd>Esc</kbd> 打开总览；<kbd>F</kbd> 全屏。若键盘没有反应，直接点右下角的翻页箭头即可。

---

## 课件大纲

| 章节 | 内容 |
| --- | --- |
| 1. 从 Hello World 开始 | 1.1 为什么从 C 语言开始；第一个程序与**逐行拆解**（`#include` / `main` / `printf` / `return`）；1.2 在电脑上编译运行（MSYS2 / WinLibs / MSVC 三选一）与编译的四个步骤（预处理 → 编译 → 汇编 → 链接）；1.3 程序结构与书写规范、五个最常见的入门报错、动手练习 |
| 2. 变量与数据类型 | 2.1 变量的声明/初始化/赋值，标识符命名规则与 C 关键字；2.2 基本数据类型表（`char` / `short` / `int` / `long long` / `float` / `double` 的大小与范围）、`sizeof` 与整数溢出、常量（`#define` 与 `const`）、类型转换（整数除法陷阱）；2.3 运算符总览（算术/关系/逻辑/赋值/自增自减/位运算）与四个高频陷阱、优先级速记、随堂小测 |
| 3. 二进制与进制转换 | 3.1 计算机为什么只用 0 和 1、位与字节与存储单位；3.2 **除 2 取余**、**按位权相加**、十六进制速记法（4 位一组）、代码里的四种进制写法；3.3 负数与补码、`unsigned` 混用的坑、位运算（置位/清零/取位/移位）与寄存器操作实例、随堂小测与动手练习 |
| 4. 函数 | 4.1 为什么要用函数、定义/声明/调用、值传递（参数是副本）；4.2 局部变量与作用域、`static` 局部变量、多文件与头文件（`.h` 放声明、`.c` 放实现）与 GSRL 的模块划分；4.3 递归（终止条件、栈溢出风险）、随堂小测 |
| 5. 标准输入与输出 | 5.1 `printf` 格式说明符速查表、宽度与精度对齐、转义字符；5.2 `scanf` 与 `&` 的含义、`getchar` / `putchar` 与输入缓冲区；5.3 输入输出的六个坑、动手练习（四则运算 / 圆周长面积 / 打印二进制） |

课件里嵌了三段 B 站视频（都在讲解位置就地播放，无需跳转）：

| 视频 | 位置 | 用途 |
| --- | --- | --- |
| 《古代电传电报机作为 TTY 登录》 | 1.1 「回车与换行」页 | 讲清 `\n` 与「回车」两个词的由来（CR / LF、CRLF 之争） |
| 《1996 年欧洲阿丽亚娜 5 型运载火箭首飞发射失败》 | 2.2 整数溢出之前 | 先看真实事故，再讲类型范围与溢出 |
| 《大 学 第 一 次 C 语 言 作 业》 | 课后作业之前 | 轻松一下，顺便提醒作业的评分要点 |

---

## 配套资源

- **本机编译器**：[MSYS2](https://www.msys2.org/)（推荐，附带 gdb）、[WinLibs](https://winlibs.com/)（免安装 zip）、[MSVC Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- **C 语言参考**：[cppreference（C 语言中文版）](https://zh.cppreference.com/w/c)、[C 关键字表](https://zh.cppreference.com/w/c/keyword)
- **上一篇**：[从零开始电控开发 —— Lecture 1](./Lecture1.md)（电控组介绍、工具链原理、环境安装）
- **装工具链**：[Lesson1 开发环境配置](../Lesson1%20开发环境配置.md)
- **学基础**：[C++ 基础](../C++基础/index.md)（C 与 C++ 语法通用）、[嵌入式基础](../嵌入式基础/index.md)
- **学协作**：[Git 工作流](../../../文档站指南/git工作流.md)

---

## 课后作业

**每题都要能编译运行、有输出。**做完在群里贴「代码 + 运行截图」。

1. **环境**：执行 `gcc --version` 有版本号输出，并能编译运行 `hello.c`；
2. **基本输出**：写程序打印自己的姓名、组别、学号，用 `\t` 或宽度控制对齐；
3. **数据类型**：打印 `char / short / int / long long / float / double` 的 `sizeof`，把结果整理成表格；
4. **进制**：手工把 **100、200、255** 转成二进制与十六进制，再写程序用 `%x` 验算自己的答案；
5. **函数**：写 `int max3(int a, int b, int c)` 返回三个数的最大值，在 `main` 里读入三个整数并输出结果；
6. **输入输出**：输入一个 0~255 的整数，输出它的十六进制、以及用位运算 `(x >> n) & 1` 逐位打印的 8 位二进制；
7. **提交**：源文件命名为 `学号_姓名_lecture2.c`，与运行截图一起发到群里。

> **评分只看三件事**：能编译通过、输出结果正确、代码有缩进与注释。编译不过的作业等于没交——遇到问题先把报错信息读一遍再提问。

---

> **作者**: [Metalxiaoxiao](https://github.com/Metalxiaoxiao) | **修改日期**: 2026-09-20
