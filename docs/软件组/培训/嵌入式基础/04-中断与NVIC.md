# 中断与 NVIC

中断是嵌入式系统的灵魂——它让 MCU 能够"同时"处理多项任务，对外部事件做出即时响应。本章从 CPU 的中断机制讲起，深入 NVIC（嵌套向量中断控制器）的工作原理。

> 上一篇：[GPIO 与高低电平](./03-GPIO与高低电平.md)

---

## 1. 概念——为什么要中断

### 1.1 轮询 vs 中断

设想你要等一个快递。有两种方式：

- **轮询（Polling）**：每隔 5 分钟去门口看一次。大部分时间白白浪费在"看"这个动作上，而且快递可能在你两次查看之间到达，延迟最长达 5 分钟。
- **中断（Interrupt）**：门铃响了再去开门。平时你可以做别的事，快递到了立刻响应。

<figure class="diagram">
  <img src="/assets/diagrams/auto/d045-f910d4.svg" alt="轮询模式:">
  <figcaption>图：轮询模式:</figcaption>
</figure>


**为什么中断远比轮询高效？** 从 CPU 利用率的角度看，轮询的本质是 CPU 反复检查一个几乎不会变化的状态标志——这相当于让一个年薪百万的工程师天天去前台看快递到了没有。在机器人系统中，CAN 消息可能每秒到达 100 次，但轮询线程却可能每秒检查 1000 次标志位，这意味着 90% 的检查都是徒劳的，白白消耗 CPU 时间。更糟糕的是，轮询的检查间隔决定了最坏响应延迟：如果每 1ms 检查一次，事件可能刚好在检查后才发生，导致约 1ms 的额外延迟。中断则彻底消除了这种浪费——CPU 只在事件真正发生时被唤醒，其余时间全部用于执行有意义的计算任务。

### 1.2 在 MCU 中的技术本质

从 CPU 的角度看，中断是硬件层面的"插队"机制：

1. 外设（如 [CAN](./11-CAN通信原理.md) 控制器）收到数据 → 产生一个**中断请求信号**
2. CPU 完成当前指令的执行
3. CPU 检查中断优先级，决定是否响应
4. 若响应：保存当前上下文 → 跳转到**中断向量表**中的 ISR → 执行 ISR → 恢复上下文 → 继续原程序

---

## 2. NVIC——中断的总调度

### 2.1 Cortex-M 的中断体系

ARM Cortex-M 处理器有两类中断：

| 类型 | 来源 | 举例 |
|------|------|------|
| **系统异常** | CPU 内部 | Reset、NMI、HardFault、SysTick |
| **外设中断** | 片上外设 | CAN_RX、[USART](./08-UART通信原理.md)、TIM、EXTI |

NVIC（Nested Vectored Interrupt Controller）是 Cortex-M 内核的一部分，负责管理所有外设中断：

<figure class="diagram">
  <img src="/assets/diagrams/nvic-irq-flow.svg" alt="CAN/UART/TIM 等外设的中断信号进入 NVIC 的 IRQ0…IRQn，经优先级仲裁与嵌套管理后交给 CPU 核心">
  <figcaption>图：外设中断怎么走到 CPU —— NVIC 的优先级仲裁与嵌套管理</figcaption>
</figure>


### 2.2 优先级机制

NVIC 支持中断嵌套：高优先级的中断可以打断低优先级的中断。

<figure class="diagram">
  <img src="/assets/diagrams/auto/d047-796871.svg" alt="时间轴 →">
  <figcaption>图：时间轴 →</figcaption>
</figure>


**为什么需要嵌套中断？** 考虑一个真实场景：MCU 正在处理 UART 接收中断（优先级 7），此时电机驱动板检测到过流故障，触发了优先级为 3 的 CAN 中断。如果不支持嵌套，CAN 中断必须等 UART ISR 全部执行完毕才能响应——这可能需要数百微秒。对于过流故障来说，几百微秒的延迟足以烧毁 MOS 管。嵌套中断确保：高优先级的事件总能立即抢占 CPU，无论当前正在处理什么低优先级任务。

STM32 使用 **4-bit 优先级**（Cortex-M4），有两大配置：

| 术语 | 含义 | STM32F4 默认配置 |
|------|------|------------------|
| **抢占优先级** (Preemption Priority) | 决定谁能打断谁 | 4 bit 全部给抢占优先级（0~15） |
| **子优先级** (Subpriority) | 抢占优先级相同时，决定响应顺序 | 0 bit |

优先级数值越小，优先级越高。

在 CubeMX 的 NVIC 配置页面可以调整每个中断的优先级。生成的代码反映在 `stm32f4xx_hal_msp.c` 中：

```c
HAL_NVIC_SetPriority(CAN1_RX0_IRQn, 5, 0);   // 抢占优先级 5
HAL_NVIC_SetPriority(USART1_IRQn, 6, 0);     // 抢占优先级 6
HAL_NVIC_EnableIRQ(CAN1_RX0_IRQn);           // 使能中断
```

---

## 3. 中断向量表——中断的"电话本"

### 3.1 什么是中断向量表

中断向量表是 Flash 起始位置的一张跳转表，每个表项存着一个函数的入口地址。当特定中断发生时，CPU 硬件会自动从表中取出对应地址并跳转。

<figure class="diagram">
  <img src="/assets/diagrams/auto/d048-15ee3b.svg" alt="内存地址 / 内容">
  <figcaption>图：内存地址 / 内容</figcaption>
</figure>


### 3.2 启动文件中的定义

在 `startup_stm32f407xx.s`（汇编启动文件）中：

```asm
g_pfnVectors:
    .word  _estack              /* 栈顶 */
    .word  Reset_Handler        /* 复位 */
    .word  NMI_Handler
    .word  HardFault_Handler
    /* ... */
    .word  CAN1_RX0_IRQHandler  /* CAN1 接收中断 */
    /* ... */

/* 默认弱定义：如果用户没有提供 ISR，使用死循环 */
.weak  CAN1_RX0_IRQHandler
.thumb_set CAN1_RX0_IRQHandler, Default_Handler
```

`.weak` 表示"弱定义"——如果用户在别处实现了同名函数，就使用用户的版本；否则使用默认版本（死循环）。

---

## 4. 中断的完整执行路径

以一个 CAN 数据帧到达为例，追踪中断的完整路径：

```
第1步：硬件触发
    CAN 控制器收到一帧数据
    → CAN1 的 RX FIFO 0 非空
    → 产生 CAN1_RX0 中断请求

第2步：NVIC 裁决
    NVIC 比较 CAN1_RX0 的优先级（5）和当前运行的中断优先级
    如果优先级更高 → 触发 CPU 中断

第3步：CPU 响应
    ① 硬件自动压栈：保存 R0-R3, R12, LR, PC, xPSR
    ② 从中断向量表取出 CAN1_RX0_IRQHandler 的地址
    ③ 跳转到 CAN1_RX0_IRQHandler

第4步：ISR 执行（stm32f4xx_it.c）
    void CAN1_RX0_IRQHandler(void)
    {
        HAL_CAN_IRQHandler(&hcan1);  // HAL 库的中断分发函数
    }

第5步：HAL 中断分发（stm32f4xx_hal_can.c）
    void HAL_CAN_IRQHandler(CAN_HandleTypeDef *hcan)
    {
        // 检查中断标志位，确认是哪个事件
        if (__HAL_CAN_GET_FLAG(hcan, CAN_FLAG_RF0M)) {
            // 清除中断标志
            __HAL_CAN_CLEAR_FLAG(hcan, CAN_FLAG_RF0M);
            // 读取数据
            HAL_CAN_GetRxMessage(hcan, CAN_RX_FIFO0, &header, data);
            // 调用用户回调
            HAL_CAN_RxFifo0MsgPendingCallback(hcan);
        }
    }

第6步：用户[回调](./05-回调机制与HAL中断处理.md)（drv_can.c / 用户代码）
    void HAL_CAN_RxFifo0MsgPendingCallback(CAN_HandleTypeDef *hcan)
    {
        // 用户自定义的数据处理逻辑
        // 放入 FreeRTOS 队列 / 直接处理
    }

第7步：返回
    ISR 执行完毕 → 硬件自动出栈恢复上下文 → 继续执行被中断的代码
```

### 4.1 关键原则：ISR 要快

中断服务函数（ISR）中**不能做耗时操作**，原则是：

- **只做必要的事**：读数据、清标志、发信号
- **把重活交给任务**：通过 [FreeRTOS](./01-嵌入式系统概述与HAL库.md) 队列/信号量通知任务线程去处理

```c
// ❌ 错误：在 ISR 中做耗时计算
void HAL_CAN_RxFifo0MsgPendingCallback(CAN_HandleTypeDef *hcan)
{
    // 解析协议、PID 计算、发送应答... 全部在 ISR 中！
}

// ✅ 正确：ISR 只入队，任务线程做重活
void HAL_CAN_RxFifo0MsgPendingCallback(CAN_HandleTypeDef *hcan)
{
    can_rx_message_t msg;
    HAL_CAN_GetRxMessage(hcan, CAN_RX_FIFO0, &msg.header, msg.data);
    xQueueSendToBackFromISR(canRxQueueHandle, &msg, &xHigherPriorityTaskWoken);
    portYIELD_FROM_ISR(xHigherPriorityTaskWoken);  // 必要时触发任务切换
}
```

**为什么 ISR 必须短？** ISR 执行期间，所有同优先级和更低优先级的中断被全部阻塞，FreeRTOS 的任务调度器也被冻结——这意味着整个系统的所有任务线程都停止运行。举例：如果 CAN 接收 ISR 耗时 100μs，而 CAN 消息以 1kHz 频率到达，仅 CAN 中断就占用了 100μs × 1000 = 100ms/秒，即 10% 的 CPU 时间。如果某个 ISR 写成了 1ms，而它恰好以 1kHz 频率触发，CPU 就被 100% 占满，其他所有任务（包括 FreeRTOS 空闲任务和看门狗喂狗）都无法执行。这就是为什么 ISR 只做"数据搬运"，重活交给任务线程。

---

## 5. 常见中断类型及用途

| 中断源 | 在 GSRL 中的用途 | 触发条件 |
|--------|-----------------|----------|
| **CAN_RX** | 接收电机反馈、裁判系统数据 | CAN 总线收到匹配 ID 的帧 |
| **USART_IDLE** | 接收遥控器、裁判系统串口数据 | 串口空闲（一帧数据接收完毕） |
| **EXTI** (外部中断) | IMU 数据就绪通知 | BMI088 的 INT1 引脚上升/下降沿 |
| **TIM** (定时器中断) | 系统时间基准（SysTick 替代）、PWM 控制 | 定时器计数值达到预设值 |
| **DMA** | [SPI](./09-SPI通信原理.md)/UART 传输完成通知 | DMA 传输完成（DMA 回调处理见[回调机制](./05-回调机制与HAL中断处理.md)） |

在 GSRL 的 `stm32f4xx_it.c` 中可以看到所有这些 ISR 的实现：

```c
void CAN1_RX0_IRQHandler(void)  { HAL_CAN_IRQHandler(&hcan1);  }
void USART1_IRQHandler(void)    { HAL_UART_IRQHandler(&huart1); }
void DMA2_Stream2_IRQHandler(void) { HAL_DMA_IRQHandler(&hdma_spi1_rx); }
void EXTI4_IRQHandler(void)     { HAL_GPIO_EXTI_IRQHandler(INT1_ACCEL_Pin); }
```

---

## 6. 中断优先级配置建议

在机器人控制系统中，中断优先级的分配需要权衡实时性要求：

| 中断 | 建议优先级 | 原因 |
|------|-----------|------|
| CAN 接收 | 较高（3~5） | 电机反馈数据不能丢失 |
| IMU 外部中断 | 较高（3~5） | 姿态数据有严格的时效性 |
| USART 空闲中断 | 中等（5~7） | 遥控器数据可以承受轻微延迟 |
| DMA 完成中断 | 中等（5~7） | 传输完成通知，及时处理即可 |
| 定时器 | 根据用途 | 系统时钟（SysTick）通常用最低优先级 |

> **注意**：在 FreeRTOS 环境下，中断优先级不能高于 `configLIBRARY_MAX_SYSCALL_INTERRUPT_PRIORITY`（通常设为 5），否则 ISR 中不能调用 FreeRTOS 的 API（如 `xQueueSendFromISR`）。
>
> **为什么有这个限制？** FreeRTOS 通过临界区（critical section）来保护内核数据结构（如任务就绪列表、队列）。临界区的实现方式是暂时屏蔽优先级低于某个阈值的中断。如果某个 ISR 的优先级高于这个阈值，它就能在临界区内"插队"执行——此时如果该 ISR 调用 FreeRTOS API（如 `xQueueSendFromISR`），就会在临界区中修改内核数据，导致竞态条件，轻则数据错乱，重则系统崩溃。因此，任何需要调用 FreeRTOS API 的 ISR，其优先级必须 ≤ `configLIBRARY_MAX_SYSCALL_INTERRUPT_PRIORITY`（数值上 ≥ 5），确保它会被临界区正确屏蔽。

**为什么 SysTick 必须使用最低优先级？** SysTick 是 FreeRTOS 的"心跳"——每次 SysTick 中断都会触发任务调度器检查是否有更高优先级任务就绪。如果 SysTick 的优先级高于某个硬件中断（如 CAN 接收），那么 SysTick 可能在 CAN ISR 执行期间抢占进来并尝试切换任务。但在 ISR 上下文中进行任务切换是危险的，可能导致不可预期的行为。将 SysTick 设为最低优先级，确保它永远不会打断任何硬件中断，只在所有 ISR 都处理完毕后才执行任务调度。

---

## 7. 总结

| 要点 | 说明 |
|------|------|
| 中断 | 硬件事件触发 CPU 暂停当前任务，执行 ISR 的机制 |
| NVIC | Cortex-M 的中断控制器，管理优先级和嵌套 |
| 中断向量表 | 中断号 → ISR 函数地址的映射表 |
| ISR 执行路径 | 硬件触发 → NVIC 裁决 → 查向量表 → ISR → HAL 分发 → 回调 |
| ISR 原则 | 快速执行，复杂逻辑通过队列/信号量交给任务 |
| 优先级 | 数值越小优先级越高，FreeRTOS API 有最高优先级限制 |

> 下一篇：[回调机制与 HAL 中断处理](./05-回调机制与HAL中断处理.md)

> **作者**: [Qing](https://github.com/ZhangChuqing) | **修改日期**: 2026-07-18
