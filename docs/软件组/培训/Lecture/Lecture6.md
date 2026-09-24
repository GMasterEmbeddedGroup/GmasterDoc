# STM32F103 GPIO 详解 —— Lecture 6

面向已经完成基础环境配置的新队员。70 页自学型课件以 STM32F103C8T6 和常见 Blue Pill 最小系统板为例，按“GPIO 基础 → 八种工作模式 → F103 寄存器 → CubeMX/HAL → NVIC 与 EXTI → 调试实操”的顺序展开。所有新概念先给出定义、用途和电路含义，再进入配置与代码。

课件不依赖讲师备注：关键页包含进一步解释、常见误区和操作结果。首次学习建议按顺序阅读，不要跳过电压、电流、上下拉和引脚命名等前置内容。

---

## 课件

<div style="border:1px solid var(--md-default-fg-color--lightest);border-radius:8px;overflow:hidden;background:#fff">
  <iframe src="../slides/lecture6/index.html" title="STM32F103 GPIO 详解 —— Lecture 6（交互式课件）" style="display:block;width:100%;aspect-ratio:16/10;border:0" allowfullscreen loading="lazy" onclick="this.contentWindow.focus()"></iframe>
</div>

<a href="../slides/lecture6/index.html" target="_blank" rel="noopener">全屏打开课件</a>

> **操作提示**：点击课件后使用 <kbd>←</kbd> <kbd>→</kbd> 或 <kbd>空格</kbd> 翻页，<kbd>Esc</kbd> 打开总览，<kbd>F</kbd> 全屏。

## 参考资料

- [ST RM0008 参考手册](https://www.st.com/resource/en/reference_manual/cd00171190-stm32f101-103-105-107-stm32f100-series-armbased-32bit-mcus-stmicroelectronics.pdf)
- [STM32F103x8/xB 数据手册](https://www.st.com/resource/en/datasheet/stm32f103t8.pdf)
- [STM32CubeF1 HAL GPIO](https://github.com/STMicroelectronics/stm32f1xx-hal-driver)
- [Blue Pill 开源原理图](https://github.com/STM32-base/STM32-base.github.io/blob/master/assets/pdf/boards/original-schematic-STM32F103C8T6-Blue_Pill.pdf)

> **作者**: [Metalxiaoxiao](https://github.com/Metalxiaoxiao) | **修改日期**: 2026-09-24
