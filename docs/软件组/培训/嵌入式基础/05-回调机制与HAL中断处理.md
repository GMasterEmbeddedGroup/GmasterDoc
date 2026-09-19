# 回调机制与 HAL 中断处理

HAL 库的精髓在于"回调"。理解 HAL 如何将硬件[中断](./04-中断与NVIC.md)转化为用户可控的回调函数，是编写健壮嵌入式代码的关键。本章剖析 HAL 的中断处理链，并展示 GSRL 如何在这一机制之上构建 Driver 层。

> 上一篇：[中断与 NVIC](./04-中断与NVIC.md)

---

## 1. 概念——回调解决了什么问题

### 1.1 问题的提出

每个外设中断都需要一个 ISR（中断服务函数），而 ISR 的名字和数量由启动文件中的中断向量表固定。例如 [CAN](./11-CAN通信原理.md)1 接收中断的 ISR 必须叫 `CAN1_RX0_IRQHandler`。

如果让你直接在 `CAN1_RX0_IRQHandler` 里写数据处理逻辑：

```c
// ❌ 问题1：直接耦合
void CAN1_RX0_IRQHandler(void)
{
    // CAN1 收电机反馈 → 解析 → 更新电机状态
    // CAN1 收裁判系统 → 解析 → 更新裁判数据
    // 两种完全不同的逻辑混在一个 ISR 里
}

// ❌ 问题2：不可复用
// 另一个工程也用 CAN1，但外设完全不同，ISR 代码得重写
```

HAL 库的解决方案：

```
CAN1_RX0_IRQHandler          (固定入口，CubeMX 生成)
    │
    ▼
HAL_CAN_IRQHandler           (HAL 库统一分发，判中断源)
    │
    ▼
HAL_CAN_RxFifo0MsgPendingCallback (用户实现的回调，可自由定义)
```

ISR 只做**通用的中断清理**（清标志位、读寄存器），具体的业务逻辑交给**回调函数**。这样用户只需要实现回调，无需关心 ISR 入口和中断标志。

**为什么要把 ISR 和用户回调分开？** 这种分层设计有两个关键好处：第一，**容错隔离**——ISR 中的寄存器清理是硬件正确运行的前提（不清理标志位会导致中断反复触发），这部分逻辑不能出错。如果用户直接在 ISR 中写业务代码，一旦用户代码访问野指针或除零触发 HardFault，整个中断处理链就断了，系统难以恢复。分层后，HAL 的 ISR 先把硬件"伺候好"（清标志、读数据），再调用用户回调——即使回调崩溃，至少中断系统还能正常运行。第二，**多路复用**——同一个 CAN 中断可能对应多个用户（电机模块订阅、裁判系统模块订阅），分层后可以在中间层维护一个回调列表，一个中断触发，通知所有订阅者。

### 1.2 回调的本质

回调（Callback）即**"事件发生时，由框架调用你的函数"**。你注册一个函数指针，框架在合适的时机调用它。

```c
// 伪代码：回调的本质
typedef void (*CallbackFunc)(void *data);   // 回调函数类型

struct Driver {
    CallbackFunc userCallback;              // 存储用户提供的函数指针
};

// 用户注册回调
driver.userCallback = myHandler;

// 框架在事件发生时调用
void onEvent(struct Driver *drv) {
    if (drv->userCallback != NULL) {
        drv->userCallback(eventData);       // 回调用户函数
    }
}
```

---

## 2. HAL 的中断处理链路

### 2.1 完整链路图

以 CAN 接收中断为例，完整的调用链路如下：

<figure class="diagram">
  <img src="/assets/diagrams/auto/d049-978dd9.svg" alt="硬件层">
  <figcaption>图：硬件层</figcaption>
</figure>


### 2.2 HAL 回调的类型

HAL 为每个外设定义了一套 `__weak` 回调函数：

| 外设 | 常见回调 | 触发时机 |
|------|---------|----------|
| **CAN** | `HAL_CAN_RxFifo0MsgPendingCallback` | CAN 收到数据 |
| **[UART](./08-UART通信原理.md)** | `HAL_UARTEx_RxEventCallback` | UART 空闲中断（一帧收完） |
| **UART** | `HAL_UART_ErrorCallback` | UART 通信错误 |
| **[SPI](./09-SPI通信原理.md)** | `HAL_SPI_TxRxCpltCallback` | SPI 收发完成 |
| **SPI** | `HAL_SPI_ErrorCallback` | SPI 通信错误 |
| **TIM** | `HAL_TIM_PeriodElapsedCallback` | 定时器溢出 |
| **GPIO** | `HAL_GPIO_EXTI_Callback` | 外部中断触发 |

`__weak` 意味着 HAL 库提供了默认的空实现，用户可以在自己的代码中重写：

```c
// HAL 库中的弱定义（什么都不做）
__weak void HAL_CAN_RxFifo0MsgPendingCallback(CAN_HandleTypeDef *hcan)
{
    /* NOTE: This function should not be modified, and can be implemented
             in the user file */
}

// 用户在 drv_can.c 中重写（强定义覆盖弱定义）
void HAL_CAN_RxFifo0MsgPendingCallback(CAN_HandleTypeDef *hcan)
{
    // 实际的数据处理逻辑
}
```

**为什么用弱定义（`__weak`）？** 这是嵌入式软件开发中一个关键的工程模式——实现"生成代码与用户代码的分离"。HAL 库的源码和 CubeMX 生成的代码都不需要被用户修改，所有回调默认指向空实现，编译链接完全正常。当用户需要某个回调时，只需在自己的文件中定义一个同名函数，链接器就会自动用"强定义"覆盖默认的"弱定义"。这意味着：HAL 库升级时，用户只需替换库文件，自己的回调代码毫发无伤；CubeMX 重新生成代码时，也不会覆盖用户的回调实现（因为回调写在独立的用户文件中）。这种"弱-强覆盖"机制让固件工程师可以在不修改第三方代码的前提下定制行为，是 STM32 开发生态中最优雅的设计之一。

---

## 3. GSRL Driver 层的回调管理

### 3.1 问题：一个外设，多种用途

同一个 CAN 总线上可能挂着电机、裁判系统、超级电容等多种设备。HAL 层的回调只有一个入口，如何区分数据去向？

GSRL 的解决方案：**在 Driver 层实现 HAL 回调，内部维护用户注册的回调函数指针**。

以 CAN 驱动为例（`drv_can.c`）：

```c
// CAN 管理对象
typedef struct {
    CAN_HandleTypeDef *hcan;                        // HAL 句柄
    CAN_Call_Back rxCallbackFunction;               // 用户注册的回调
} CAN_Manage_Object_t;

// 初始化时注册回调
void CAN_Init(CAN_HandleTypeDef *hcan, CAN_Call_Back rxCallbackFunction)
{
    CAN_Manage_Object_t *can_obj = CAN_Get_Object(hcan);
    can_obj->hcan = hcan;
    can_obj->rxCallbackFunction = rxCallbackFunction;  // 保存用户回调
    // ...
}

// HAL 回调中：先入队列，再调用用户回调
void HAL_CAN_RxFifo0MsgPendingCallback(CAN_HandleTypeDef *hcan)
{
    can_rx_message_t s_rx_msg;
    HAL_CAN_GetRxMessage(hcan, CAN_RX_FIFO0, &s_rx_msg.header, s_rx_msg.data);

    // 1. 放入 FreeRTOS 队列（给任务线程使用）
    xQueueSendToBackFromISR(canRxQueueHandle, &s_rx_msg, &woken);

    // 2. 调用用户注册的回调（给 ISR 直接处理）
    CAN_Manage_Object_t *can_obj = CAN_Get_Object(hcan);
    if (can_obj->rxCallbackFunction != NULL) {
        can_obj->rxCallbackFunction(&s_rx_msg);
    }
}
```

### 3.2 UART 驱动的回调

UART 也采用同样的模式（`drv_uart.c`）：

```c
typedef struct {
    UART_HandleTypeDef *huart;
    UART_Call_Back rxCallbackFunction;   // 用户回调
    uint8_t rxBuffer[UART_BUFFER_SIZE];  // DMA 接收缓冲区
    uint16_t rxDataLimit;               // 最大接收长度
} UART_Manage_Object_t;

// 初始化：启动 DMA 接收，注册回调
void UART_Init(UART_HandleTypeDef *huart, UART_Call_Back rxCallbackFunction,
               uint16_t rxDataLimit)
{
    UART_Manage_Object_t *uart_obj = UART_Get_Object(huart);
    uart_obj->rxCallbackFunction = rxCallbackFunction;
    HAL_UARTEx_ReceiveToIdle_DMA(huart, uart_obj->rxBuffer, rxDataLimit);
}

// HAL 空闲中断回调
void HAL_UARTEx_RxEventCallback(UART_HandleTypeDef *huart, uint16_t Size)
{
    UART_Manage_Object_t *uart_obj = UART_Get_Object(huart);
    if (uart_obj->rxCallbackFunction != NULL) {
        uart_obj->rxCallbackFunction(uart_obj->rxBuffer, Size);
    }
    // 重启 DMA 接收，准备下一帧
    HAL_UARTEx_ReceiveToIdle_DMA(huart, uart_obj->rxBuffer, uart_obj->rxDataLimit);
}
```

**为什么必须用 DMA + IDLE 中断接收 UART 数据？** UART 数据帧的长度通常是可变的（遥控器数据 18 字节、裁判系统数据可能 128 字节），如果没有 IDLE 中断，接收方无法判断一帧数据什么时候结束——只能在每个字节到达时盲目地往缓冲区里塞。而如果每个字节都触发一次中断（字节中断模式），在 115200 bps 波特率下，每秒会有约 11520 个字节 → 11520 次中断 → 每次中断至少几十个 CPU 周期，合计约 8.6% 的 CPU 时间全部浪费在 UART 接收上。DMA 解决了"谁来搬数据"的问题：硬件自动将每个收到的字节写入内存，CPU 完全不参与。IDLE 中断解决了"什么时候一帧结束"的问题：当总线空闲超过一个字节时间，硬件自动产生 IDLE 中断，此时 DMA 已将所有收到的字节搬完，回调只需取走完整的一帧。DMA + IDLE 的组合让 CPU 从"逐字节接客"变成"收完一帧叫我"，效率提升数百倍。

### 3.3 用户侧的使用方式

在任务中分别初始化不同外设的驱动，注册各自的回调：

```cpp
// tsk_test.cpp
extern "C" void test_task(void *argument)
{
    CAN_Init(&hcan1, can1RxCallback);        // CAN1: 处理电机反馈
    UART_Init(&huart3, dr16ITCallback, 36);  // UART3: 处理遥控器数据
    // ...
}

// CAN 接收回调
extern "C" void can1RxCallback(can_rx_message_t *pRxMsg)
{
    motor.decodeCanRxMessageFromISR(pRxMsg);
}

// UART 接收回调
extern "C" void dr16ITCallback(uint8_t *Buffer, uint16_t Length)
{
    dr16.receiveRxDataFromISR(Buffer);
}
```

---

## 4. 中断上半部 vs 下半部

### 4.1 模式对比

在嵌入式系统中，"中断处理"通常分为两半：

<figure class="diagram">
  <img src="/assets/diagrams/auto/d050-665d2f.svg" alt="上半部 (Top Half / ISR 中)">
  <figcaption>图：上半部 (Top Half / ISR 中)</figcaption>
</figure>


### 4.2 GSRL 中的体现

GSRL 的 CAN 驱动同时支持两种路径：

<figure class="diagram">
  <img src="/assets/diagrams/auto/d051-67f3dd.svg" alt="CAN 中断触发">
  <figcaption>图：CAN 中断触发</figcaption>
</figure>


**如何选择用回调还是队列？** 这是一个执行时间和操作复杂度的权衡。ISR 回调适合 1~2 微秒级的极轻量操作——例如把 CAN 数据帧中的某几个字节提取出来赋值给一个标志位。FreeRTOS 队列适合涉及状态机、协议解析或多级计算的复杂操作。举一个具体例子：电机通过 CAN 发回位置反馈（8 字节原始数据），在 ISR 回调中只做"提取 8 字节 raw data 放到一个结构体"（约 2μs），然后通过队列发给 Motor 任务；Motor 任务收到后执行完整的协议解析、零点偏移补偿、单位换算，最终更新电机对象的状态（约 50μs）。如果这 50μs 的操作放在 ISR 回调中，不仅阻塞所有低优先级中断，还会累积出可观的 CPU 占用。


在 Motor 类中对应两个方法：

```cpp
// ISR 中直接调用（上半部）
bool decodeCanRxMessageFromISR(const can_rx_message_t *rxMessage);

// 任务中从队列取出后调用（下半部）
bool decodeCanRxMessageFromQueue(const can_rx_message_t *rxMessage, uint8_t Size);
```

---

## 5. 常见陷阱

| 陷阱 | 后果 | 正确做法 |
|------|------|---------|
| ISR 中调用阻塞函数 | 系统死锁或优先级反转 | ISR 只能用 `FromISR` 后缀的 [FreeRTOS](./01-嵌入式系统概述与HAL库.md) API |
| ISR 中执行耗时计算 | 低优先级中断永远得不到响应 | 把复杂逻辑移到任务中 |
| 忘记清除中断标志 | 中断反复触发，CPU 被 ISR 占满 | HAL 已处理，直接操作寄存器时要注意 |
| 回调函数未注册 | 收到数据但无人处理 | 初始化时确保注册了有效的回调函数 |
| 在回调中忘记重启 DMA 接收 | 只接收了一帧就停止 | UART 空闲回调末尾必须重调用 `ReceiveToIdle_DMA` |

---

## 6. 总结

| 要点 | 说明 |
|------|------|
| 回调机制 | ISR（固定入口）→ HAL 分发 → 用户回调（弱定义覆盖） |
| GSRL Driver 层 | 实现 HAL 回调，维护用户注册的回调函数指针 |
| 两种回调路径 | ISR 中直接回调（轻量）+ FreeRTOS 队列（重量级延迟处理） |
| 上半部/下半部 | ISR 只做数据搬运，任务线程做协议解析和业务逻辑 |
| UART 空闲中断 | 一帧数据接收完成后触发，处理后需重启 DMA 接收 |

### 与 GSRL 的关系

GSRL 的 Driver 层（`drv_can.c`、`drv_uart.c`、`drv_spi.c`）正是围绕 HAL 回调机制设计的。它重写了 HAL 的 `__weak` 回调函数，在回调内部管理 FreeRTOS 队列和用户注册的回调链，屏蔽了裸 HAL 的使用复杂度。

> 下一篇：[定时器与 PWM](./06-定时器与PWM.md)

> **作者**: [Qing](https://github.com/ZhangChuqing) | **修改日期**: 2026-07-18
