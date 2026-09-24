# C 语言程序设计（二）—— Lecture 3

这一讲从“数据在内存里怎样摆放”出发，依次讲清**结构体、内存对齐、指针、大小端、中断与回调函数**，最后在 STM32F103C8T6 上完成从轮询到中断驱动的“点灯大师”实战。

---

## 课件

<div style="border:1px solid var(--md-default-fg-color--lightest);border-radius:8px;overflow:hidden;background:#fff">
  <iframe
    src="../slides/lecture3/index.html"
    title="C 语言程序设计（二）—— Lecture 3（交互式课件）"
    style="display:block;width:100%;aspect-ratio:16/10;border:0"
    allowfullscreen
    loading="lazy"
    onclick="this.contentWindow.focus()"></iframe>
</div>

<a href="../slides/lecture3/index.html" target="_blank" rel="noopener">全屏打开课件</a>

> **操作提示**：点击课件后，用 <kbd>←</kbd> <kbd>→</kbd> 或 <kbd>空格</kbd> 翻页；<kbd>Esc</kbd> 打开总览；<kbd>F</kbd> 全屏。随堂小测可以直接点选答案。

---

## 课件大纲

| 章节 | 内容 |
| --- | --- |
| 1. 结构体 | 结构体的用途、定义与初始化、成员访问、`typedef`、结构体数组、嵌套结构体与结构体指针 |
| 2. 内存对齐 | 成员对齐、尾部填充、成员顺序对空间的影响、`sizeof`、`offsetof`、`#pragma pack` / `__attribute__((packed))` 的写法、作用域、布局示例与未对齐访问风险 |
| 3. 指针 | 地址、取地址与解引用、指针与数组、`const` 的四种写法、函数指针、空指针/野指针/悬空指针 |
| 4. 大小端 | 多字节整数的字节顺序、运行时检测、网络字节序、协议拆包与避免未对齐访问 |
| 5. 中断与回调函数 | 轮询与中断、ISR 的工作边界、`volatile`、回调函数、STM32 HAL 的中断调用链 |
| 6. 点灯大师 | 轮询闪烁、定时器中断、按键外部中断、回调驱动灯效、排错清单（LED 电路与 CubeMX 工程配置沿用 Lecture 1 小作业） |

## 练习

- [洛谷 P5740「最厉害的学生」](https://www.luogu.com.cn/problem/P5740)：读取结构体数组，按总分选择记录。
- [洛谷 P5744「培训」](https://www.luogu.com.cn/problem/P5744)：批量修改结构体并输出。
- **内存侦探**：预测三种结构体成员顺序的 `sizeof` 与 `offsetof`，再运行程序验证。
- **只用指针**：实现 `swap_int`、`reverse` 与 `max_element`，函数体禁止使用下标。
- **协议拆包器**：从字节数组按大端解析 `uint16_t` 和 `uint32_t`，不得强制转换为整型指针。
- **点灯大师**：完成轮询闪烁、定时器闪烁、按键切换灯效三个等级。

> 洛谷题主要覆盖结构体的输入、处理与输出。内存布局、指针写法、大小端和中断依赖编译器或硬件环境，因此使用可在本机或开发板上验证的实验题。

---

## 配套资源

- **上一篇**：[C 语言第一次培训 —— Lecture 2](./Lecture2.md)
- **下一篇**：[C 语言程序设计（三）—— Lecture 4](./Lecture4.md)
- **开发板工程**：[Lecture 1 小作业：使用 STM32CubeMX 新建工程](./Lecture1小作业.md)
- **点灯实操**：[点灯大师](./点灯大师.md)（板载 LED、烧录与外接 LED）
- **参考资料**：[cppreference：C 语言](https://zh.cppreference.com/w/c)、[STM32F1 HAL 文档与工程模板](https://github.com/STMicroelectronics/STM32CubeF1)

---

> **作者**: [Metalxiaoxiao](https://github.com/Metalxiaoxiao) | **修改日期**: 2026-09-23
