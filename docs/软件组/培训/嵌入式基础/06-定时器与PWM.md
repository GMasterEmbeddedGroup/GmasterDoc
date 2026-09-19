# 定时器与 PWM

定时器是 MCU 中最灵活的外设之一——它既可以测量时间，也可以产生精确的波形（PWM）。在机器人控制中，PWM 直接驱动[舵机](./07-舵机与电机.md)，也是理解[电机](./07-舵机与电机.md)控制的基础。

> 上一篇：[回调机制与 HAL 中断处理](./05-回调机制与HAL中断处理.md)

---

## 1. 概念——定时器是什么

### 1.1 定时器的本质：计数器

定时器的核心是一个**自动递增（或递减）的计数器**。这个计数器每收到一个[时钟](./02-时钟树与总线架构.md)脉冲就加 1。当时钟频率固定时，计数值就精确地代表了时间。

<figure class="diagram">
  <img src="/assets/diagrams/auto/d052-0df4f5.svg" alt="时钟 (84MHz) / → / → / 计数值 (CNT)">
  <figcaption>图：时钟 (84MHz) / → / → / 计数值 (CNT)</figcaption>
</figure>


### 1.2 关键参数

| 参数 | 寄存器 | 含义 |
|------|--------|------|
| **预分频器** (Prescaler) | PSC | 对时钟进行分频，决定计数频率 |
| **自动重装载值** (Auto-Reload) | ARR | 计数的上限值，到达后归零（或减到零后重置） |
| **计数值** (Counter) | CNT | 当前的计数值（运行时不断变化） |
| **比较值** (Compare) | CCRx | 与 CNT 比较，相等时翻转输出（用于 PWM） |

### 1.3 定时周期计算

```
定时器时钟 = 总线时钟 / (PSC + 1)
溢出时间   = (ARR + 1) / 定时器时钟

举例：
总线时钟 = 84MHz (APB1 Timer Clock)
PSC = 8399     → 计数频率 = 84MHz / 8400 = 10kHz
ARR = 9999     → 溢出时间 = 10000 / 10kHz = 1 秒

即：该定时器每 1 秒溢出一次（产生一次更新中断）
```

**为什么需要 PSC + ARR 两级分频，而不是一个参数搞定？** 两级设计提供了"分辨率"和"周期"的独立调节能力。PSC 决定了计数器的"粒度"（每个计数值代表多长时间），ARR 决定了"总长度"（一个周期有多少个计数值）。以实际需求为例：50Hz 舵机 PWM 要求 1μs 的精细分辨率（因为 1ms~2ms 的脉宽范围只有 1000μs 的调整空间），PSC=83 即可将 84MHz 时钟降到 1MHz（1μs/步），然后 ARR=19999 给出 20ms 周期。而 20kHz 电机 PWM 不需要 μs 级分辨率，但需要高 PWM 分辨率来平滑调节（ARR=8399 提供 8400 级占空比步长），此时 PSC=0（不分频）。如果只有一个参数，要么分辨率不够细（舵机抖动），要么周期不对（频率偏移），无法同时满足两个需求。

---

## 2. 定时器的三大工作模式

### 2.1 基本定时——产生周期性中断

最简单的用法：定时器溢出时触发[中断](./04-中断与NVIC.md)，在中断中执行周期性任务。

```c
// CubeMX 配置：
// TIM7 作为系统时基，PSC=83, ARR=999  →  1ms 中断一次

void HAL_TIM_PeriodElapsedCallback(TIM_HandleTypeDef *htim)
{
    if (htim->Instance == TIM7) {
        HAL_IncTick();  // 系统 tick 计数 +1
    }
}

// FreeRTOS 的延时依赖这个 tick (HAL_GetTick())
vTaskDelay(100);  // 延时 100ms，基于 TIM7 的 1ms tick
```

### 2.2 输入捕获——测量外部信号的频率/脉宽

定时器在外部引脚发生边沿变化时，"捕获"当前的计数值。两次捕获之差 × 计数周期 = 脉冲宽度。

<figure class="diagram">
  <img src="/assets/diagrams/auto/d053-81804e.svg" alt="输入信号:">
  <figcaption>图：输入信号:</figcaption>
</figure>


典型用途：测量遥控接收机的 PWM 信号脉宽（1ms~2ms 对应 -100%~+100% 油门）。

### 2.3 输出比较 / PWM 生成

定时器的核心控制输出模式。工作原理：

<figure class="diagram">
  <img src="/assets/diagrams/auto/d054-7f04d2.svg" alt="CNT ↑">
  <figcaption>图：CNT ↑</figcaption>
</figure>


- **CNT < CCR**：输出高电平（或低电平，取决于 PWM 模式）
- **CNT ≥ CCR**：输出反相
- **ARR**：PWM 周期
- **CCR / ARR**：占空比（Duty Cycle）

PWM 占空比从 0% 到 100%，可以用来控制舵机角度、电机转速、LED 亮度等。

**为什么用 PWM 而不是真正的模拟电压？** 这是数字系统的一个核心设计哲学：MCU 是纯数字器件，要产生真正的模拟电压需要数模转换器（DAC），而 DAC 在硅片上占用面积大、成本高，大多数通用 MCU 只有 1~2 个 DAC 通道。PWM 则只需要一个定时器和一个 GPIO 引脚——任何带定时器的引脚都能输出 PWM，一个 MCU 动辄有几十路 PWM。更重要的是，电机驱动板上的 MOS 管在完全导通或完全关断时效率最高（接近零损耗），如果用线性电压驱动 MOS 管处于"半开"状态，大量功率会以热量形式耗散在 MOS 管上，轻则效率骤降，重则烧毁驱动板。PWM 让 MOS 管始终在"全开"和"全关"之间切换，通过调节开/关的时间比例来等效出不同的平均电压，既高效又精准。

---

## 3. HAL 库的 PWM 配置

### 3.1 CubeMX 配置

1. 选择一个定时器的某个通道（如 TIM1_CH1）
2. 设置 `Clock Source` 为 `Internal Clock`
3. `Channel1` 选择 `PWM Generation CH1`
4. 设置 Prescaler 和 Counter Period（即 ARR）
5. 在 GPIO 页面确认对应引脚被自动配置

### 3.2 HAL 代码操作

```c
// 启动 PWM 输出（CubeMX 生成的初始化之后手动调用）
HAL_TIM_PWM_Start(&htim1, TIM_CHANNEL_1);

// 设置占空比
// CCR 的取值范围是 0 ~ ARR（对应 0% ~ 100%）
__HAL_TIM_SET_COMPARE(&htim1, TIM_CHANNEL_1, 500);  // 如果 ARR=999，即 50% 占空比

// 停止 PWM
HAL_TIM_PWM_Stop(&htim1, TIM_CHANNEL_1);
```

---

## 4. PWM 在机器人中的典型应用

### 4.1 驱动舵机

舵机通过 PWM 的**脉宽**（而非占空比）来控制角度：

<figure class="diagram">
  <img src="/assets/diagrams/auto/d055-728746.svg" alt="脉宽 / 角度（典型值）">
  <figcaption>图：脉宽 / 角度（典型值）</figcaption>
</figure>


对应的 PWM 配置示例（周期 20ms，即 50Hz）：

```c
// TIM 配置：PSC=167, ARR=19999 → 计数频率=1MHz，周期=20ms
// 脉宽映射：1ms = 1000 计数值，2ms = 2000 计数值
__HAL_TIM_SET_COMPARE(&htim, channel, 1500);  // 1.5ms → 90° 中位
```

**为什么舵机一定要 50Hz（20ms 周期）？** 这源于航模时代的 RC 伺服协议标准——历史上所有标准舵机都按照 50Hz 脉宽调制信号设计，如果你输出 100Hz 或 200Hz 的 PWM，部分舵机完全不响应（内部解码电路只认 20ms 帧间隔）。此外，20ms 的周期给了舵机内部 PID 控制环路足够的反应时间：舵机收到脉宽指令后，内部的电机需要驱动齿轮组转动到目标位置，然后电位器反馈实际角度——这个闭环过程需要几毫秒。如果周期太短（如 5ms），舵机还没来得及转到位就被下一个指令覆盖，导致抖动甚至失控。只有在使用专门标注"高频舵机"时才可以缩短周期（如 2.5ms，即 400Hz），普通的 SG90/MG996R 等舵机请坚持 50Hz。


### 4.2 驱动直流电机（通过电调）

无刷电机通常通过**电调（ESC）**驱动，电调接收标准的 PWM 信号（1ms~2ms 脉宽），将其转换为电机三相驱动信号。

### 4.3 控制 LED 亮度

通过调整 PWM 占空比实现"模拟调光"——人的眼睛会自然平均快速闪烁的光：

```c
// 呼吸灯效果
for (int duty = 0; duty <= ARR; duty++) {
    __HAL_TIM_SET_COMPARE(&htim, channel, duty);
    HAL_Delay(2);
}
```

---

## 5. 互补 PWM 与死区

在驱动**电机半桥/H桥**时，需要两路互补的 PWM（上下管交替导通），且必须在切换时插入**死区（Dead Time）**——上下管同时导通会导致电源短路（"直通"）。

<figure class="diagram">
  <img src="/assets/diagrams/auto/d056-4e8d94.svg" alt="上管">
  <figcaption>图：上管</figcaption>
</figure>


STM32 高级定时器（TIM1、TIM8）内置死区发生器，只需配置 `BreakAndDeadTime` 参数即可：

```c
sBreakDeadTimeConfig.DeadTime = 42;  // 死区时间（单位与时钟频率有关）
HAL_TIMEx_ConfigBreakDeadTime(&htim1, &sBreakDeadTimeConfig);
```

**为什么死区是"必须"的，而不是"可选"？** MOS 管（场效应管）从接收到关断信号到真正完全关闭，存在一个物理延迟（关断时间），通常在几十纳秒到几微秒之间，取决于 MOS 管型号和驱动电路。在互补 PWM 的半桥拓扑中，上管和下管串联在电源正极和地之间。如果上管还没完全关断，下管就导通了，电流会从上管直通下管形成短路——MOS 管内阻极低（毫欧级），24V 电源通过两个导通的内阻短路，电流瞬间可达几十甚至上百安培。结果只有一个：MOS 管（甚至整个驱动板）瞬间烧毁。死区时间就是为这个物理延迟留出的"安全间隙"——在这段短暂的窗口内，上下管同时关断，确保一个彻底关闭后另一个才打开。典型死区值：低速开关 MOS 管约 1~2μs，高速 GaN MOS 管可小至 100ns。死区太短 → 直通风险，死区太长 → 电流波形畸变、电机转矩脉动增大，需要根据实际 MOS 管参数折中选取。


GSRL 中 `CubeMX_BSP/Inc/tim.h` 和 `CubeMX_BSP/Src/tim.c` 包含了定时器的初始化代码。在实际工程中，TIM1、TIM8 等高级定时器常用于电机 PWM 控制。

---

## 6. 总结

| 要点 | 说明 |
|------|------|
| 定时器本质 | 计数器 + 预分频 + 自动重装载 |
| 三大模式 | 基本定时、输入捕获、输出比较（PWM） |
| PWM 参数 | 周期 = ARR/计数频率，占空比 = CCR/ARR |
| 舵机控制 | 脉宽 0.5~2.5ms，周期 20ms |
| 死区 | 互补 PWM 必选，防止上下管直通 |
| HAL API | `PWM_Start` / `SET_COMPARE` / `PWM_Stop` |

> 下一篇：[舵机与电机控制](./07-舵机与电机.md)

> **作者**: [Qing](https://github.com/ZhangChuqing) | **修改日期**: 2026-07-18
