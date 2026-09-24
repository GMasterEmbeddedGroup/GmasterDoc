# C 语言程序设计（三）—— Lecture 4

这一讲分六个部分：先补齐条件与循环、变量作用域，再讲代码在编译前如何变化，函数调用时参数怎样传递，模块边界如何划分，状态怎样表达，以及硬件、中断和 DMA 改动数据时程序如何保证读到新值。

---

## 课件

<div style="border:1px solid var(--md-default-fg-color--lightest);border-radius:8px;overflow:hidden;background:#fff">
  <iframe src="../slides/lecture4/index.html" title="C 语言程序设计（三）—— Lecture 4（交互式课件）" style="display:block;width:100%;aspect-ratio:16/10;border:0" allowfullscreen loading="lazy" onclick="this.contentWindow.focus()"></iframe>
</div>

<a href="../slides/lecture4/index.html" target="_blank" rel="noopener">全屏打开课件</a>

> 点击课件后可用 <kbd>→</kbd> <kbd>↓</kbd> 或 <kbd>空格</kbd> 翻页，<kbd>Esc</kbd> 打开总览，<kbd>F</kbd> 全屏。

## 课程大纲

| 部分 | 内容 |
| --- | --- |
| 1. 流程控制与作用域 | 布尔值与真值（含布尔代数的由来）、`if` / `switch` 的组成部分与实例、`while` / `do-while` 与 `for` 三块内容、`break` / `continue` 的作用范围、块作用域与文件作用域、变量生命周期、左值与右值 |
| 2. 预处理进阶 | 条件编译、宏展开、多语句宏、宏函数的副作用、日志宏与编译期报错 |
| 3. 函数、地址与模块 | 函数名与地址、实参与形参、指针传参、静态局部变量、`static` 的三种用法、`extern` 与跨文件链接、声明与定义、常见链接错误 |
| 4. 联合体与枚举 | 同一段内存的多种解释方式，以及用枚举名代替状态数字 |
| 5. `volatile` | 编译器优化、寄存器、中断与 DMA；原子性、缓存与内存顺序的边界 |
| 6. 内存访问 | 调用、下标、解引用、成员访问与取址在表达式中的组合方式 |

## 练习

1. 用 `for` 遍历数组求最大值，再改写成 `while` 版本，说明两种写法在边界条件上的差别。
2. 写一个用 `switch` 处理三种电机状态的函数，故意漏掉一个 `break`，观察 fallthrough 的结果。
3. 写一个 `LOG_INFO(format, ...)` 宏，输出文件名、函数名与行号，并分别在 Debug 和 Release 配置中验证。
4. 把一个会重复计算实参的 `MAX` 宏改成 `static inline` 函数，并写出能暴露副作用问题的测试。
5. 写一个 `swap_int`：先用值传递版本确认调用方变量不变，再改为传入两个地址。
6. 把一个全局变量改成模块私有状态，头文件只公开必要的函数接口。
7. 把模块里的辅助函数改成 `static`，再把一个跨文件共享的变量改成“头文件声明 + 单一定义”，确认链接通过。
8. 编写主循环与模拟中断共享标志位的最小程序，说明 `volatile` 不能解决哪些并发问题。

---

## 配套资源

- **上一篇**：[C 语言程序设计（二）—— Lecture 3](./Lecture3.md)
- **课程目录**：[培训课程（Lecture 系列）](./index.md)
- **参考资料**：[cppreference：C 语言](https://zh.cppreference.com/w/c)、[GCC 预处理器文档](https://gcc.gnu.org/onlinedocs/cpp/)

---

> **作者**: [Metalxiaoxiao](https://github.com/Metalxiaoxiao) | **修改日期**: 2026-09-25
