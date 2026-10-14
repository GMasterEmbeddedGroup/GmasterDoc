# STM32 定时器与 PWM —— Lecture 6

本讲以 STM32F103C8T6 为例，先从 PSC、CNT、ARR 与 CCR 的关系出发，完成 PWM 调光和呼吸灯，再结合定时器结构图学习时钟源、主模式、从模式与定时器协同。课件共 88 页，适合已经完成 GPIO 基础学习、能够使用 STM32CubeMX 配置工程的新队员。

## 在线浏览 { #lecture6-online }

<div style="border:1px solid var(--md-default-fg-color--lightest);border-radius:8px;overflow:hidden;background:#fff">
  <iframe src="../assets/Lecture6.pdf#view=FitH" title="STM32 定时器与 PWM —— Lecture 6" style="display:block;width:100%;height:min(82vh,900px);border:0" loading="lazy"></iframe>
</div>

[新标签页打开 PDF](./assets/Lecture6.pdf){ .md-button .md-button--primary }
[下载 PowerPoint 课件](./assets/Lecture6.pptx){ .md-button }

> 如果浏览器无法显示内嵌 PDF，请使用“新标签页打开 PDF”。

## 课程大纲

| 章节 | 内容 |
| --- | --- |
| 定时器与 PWM 基础 | 定时器类型、PSC / CNT / ARR / CCR、输出比较、PWM 模式、频率与占空比计算 |
| PWM 调光与呼吸灯 | TIM3_CH1 与 PA6、CubeMX 配置、HAL 启动 PWM、三档亮度、呼吸灯与参数测验 |
| 时钟源与输入路径 | RCC 时钟树、Internal Clock、外部时钟模式 1 / 2、ETR、TIx、TRGI、输入捕获与编码器接口 |
| 主模式与从模式 | MMS 与 TRGO、ITR 连接、TS 触发源选择、External Clock、Reset、Gated 与 Trigger 模式 |
| 定时器协同实验 | TIM2 / TIM3 片内级联、ETR 外部脉冲计数、三种从模式对照、分频与滤波、配置练习与官方原图索引 |

---

- **上一篇**：[GPIO 基础原理与 EXTI 实践 —— Lecture 5](./Lecture5.md)
- **课程目录**：[培训课程（Lecture 系列）](./index.md)
