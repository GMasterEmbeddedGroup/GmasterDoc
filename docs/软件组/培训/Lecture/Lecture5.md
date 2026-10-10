# GPIO 基础原理与 EXTI 实践 —— Lecture 5

本讲从 STM32F103 的 GPIO 内部结构出发，介绍输入、输出和复用功能的工作原理，再进入 EXTI 外部中断、NVIC、HAL 中断处理与 USART 中断发送。课件共 71 页，适合已经完成 STM32CubeMX 基础配置的新队员。

## 在线浏览 { #lecture5-online }

<div style="border:1px solid var(--md-default-fg-color--lightest);border-radius:8px;overflow:hidden;background:#fff">
  <iframe src="../Lecture5.pdf#view=FitH" title="GPIO 基础原理与 EXTI 实践 —— Lecture 5" style="display:block;width:100%;height:min(82vh,900px);border:0" loading="lazy"></iframe>
</div>

[新标签页打开 PDF](./Lecture5.pdf){ .md-button .md-button--primary }
[下载 PowerPoint 课件](./Lecture5.pptx){ .md-button }

> 如果浏览器无法显示内嵌 PDF，请使用“新标签页打开 PDF”。Lecture 5 的旧 HTML 课件仍不对外展示。

## 课程大纲

| 章节 | 内容 |
| --- | --- |
| GPIO 基础 | GPIO 内部结构、保护电路、5V 容忍引脚、寄存器位域与端口寄存器 |
| 输入与输出模式 | STM32F103 的八种 GPIO 模式、CubeMX 配置、IDR、ODR、BSRR、推挽与开漏输出 |
| 复用功能 | USART 引脚配置、片上外设数据源与引脚重映射 |
| EXTI 与 NVIC | GPIO 到 EXTI 线的映射、边沿检测、挂起位、共享 IRQ、优先级与 HAL 回调 |
| 中断实践 | 按键抖动、EXTI 调用链、USART 中断发送及两类中断的共同结构 |

---

- **上一篇**：[C 语言程序设计（三）—— Lecture 4](./Lecture4.md)
- **课程目录**：[培训课程（Lecture 系列）](./index.md)
