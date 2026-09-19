# UART 通信原理与实践

UART（Universal Asynchronous Receiver/Transmitter，通用异步收发器）是最简单、最广泛使用的串行通信协议。从调试串口到遥控器接收，UART 在嵌入式系统中无处不在。

> 上一篇：[舵机与电机控制](./07-舵机与电机.md)

---

## 1. 概念——异步串行通信

### 1.1 同步 vs 异步

通信协议的第一层分类：是否需要独立的[时钟](./02-时钟树与总线架构.md)线。

<figure class="diagram">
  <img src="/assets/diagrams/auto/d063-d6974d.svg" alt="同步通信（如 SPI）:">
  <figcaption>图：同步通信（如 SPI）:</figcaption>
</figure>


### 1.2 UART 解决的问题

UART 将并行的字节数据转换为串行的比特流，通过一根 TX 线和一根 RX 线传输。异步意味着**不用共享时钟**——双方约定好传输速率（波特率）即可。

<figure class="diagram">
  <img src="/assets/diagrams/auto/d064-906c43.svg" alt="发送端: / 接收端:">
  <figcaption>图：发送端: / 接收端:</figcaption>
</figure>


---

## 2. UART 的物理层

### 2.1 数据帧格式

一个 UART 数据帧包含以下部分：

<figure class="diagram">
  <img src="/assets/diagrams/auto/d065-91c83f.svg" alt="空闲 / 起始位 / 数据位 (5~9 bit) / [校验位] / 停止位 / 空闲">
  <figcaption>图：空闲 / 起始位 / 数据位 (5~9 bit) / [校验位] / 停止位 / 空闲</figcaption>
</figure>


| 组成部分 | 长度 | 说明 |
|---------|------|------|
| **空闲** | 任意 | 空闲时保持高电平 |
| **起始位** | 1 bit | 低电平，告知接收方"数据来了" |
| **数据位** | 5~9 bit（通常 8） | 实际数据，LSB 先发 |
| **校验位** | 0~1 bit（通常无） | 奇偶校验，可选 |
| **停止位** | 1~2 bit（通常 1） | 高电平，表示一帧结束 |

**为什么需要起始位？** 接收方在没有数据传输时面对的是随机噪声电平。起始位的**下降沿**提供了明确的"数据开始"信号——接收方检测到下降沿后，开始在精确的时间点采样后续数据位。这个下降沿本质上是收发双方的**同步信号**：接收方以它为起点，按照约定的波特率推算每个数据位的最佳采样时刻。

**为什么需要停止位？** 停止位保证了两帧之间有一个**最小间隔**。如果没有停止位，两帧连续发送时，前一帧的最后一位和后一帧的起始位将无缝衔接，接收方无法区分帧边界。同时，停止位提供了**上升沿**让接收方验证自身时钟是否仍然同步——如果接收方在停止位时刻采到低电平，说明收发双方的波特率偏差过大。

**为什么先发 LSB（低位）？** 这源于早期 UART 芯片的硬件实现：移位寄存器自然向右移位，LSB 最先被移出。从通信角度看，对于低速调制解调器，先发送变化最快的低位比特也有利于信号同步。这一惯例被沿袭至今，成为所有 UART 设备的标准。

### 2.2 波特率（Baud Rate）

波特率即每秒传输的比特数（包括起始/停止/校验位）。收发双方必须约定相同的波特率。

```
常用波特率: 9600, 19200, 38400, 57600, 115200, 921600

以 115200 bps 为例：
每 bit 时间 = 1 / 115200 ≈ 8.68 μs
传输 1 字节（8N1 = 起始 1 + 数据 8 + 停止 1 = 10 bit）
耗时 = 10 × 8.68 μs ≈ 86.8 μs
最大吞吐 = 115200 / 10 = 11520 字节/秒 ≈ 11.5 KB/s
```

### 2.3 电平标准

| 标准 | 逻辑 1 (高) | 逻辑 0 (低) | 用途 |
|------|------------|------------|------|
| **TTL/CMOS** (MCU 直连) | 3.3V / 5V | 0V | 板级短距离通信 |
| **RS-232** | -3V ~ -15V | +3V ~ +15V | PC 串口（DB9 接口） |
| **RS-485** | 差分信号 (A > B) | 差分信号 (A < B) | 工业长距离（千米级） |

> **注意**：STM32 引脚输出的是 TTL 电平，与 PC 的 RS-232 电平不兼容！需要使用 MAX232 等电平转换芯片，或直接使用 USB-TTL 转换器（如 CP2102、CH340）。

---

## 3. UART 的外设硬件

### 3.1 STM32 的 USART 外设

STM32 的 USART（Universal Synchronous/Asynchronous Receiver/Transmitter）不仅支持异步通信，还支持同步模式（带时钟线）。在 GSRL 中我们只使用异步模式（UART）。

<figure class="diagram">
  <img src="/assets/diagrams/auto/d066-c2de8e.svg" alt="USART 外设内部">
  <figcaption>图：USART 外设内部</figcaption>
</figure>


### 3.2 过采样机制

UART 接收端并不知道发送端的精确时钟相位，因此需要**过采样**来找到每个比特的最佳采样点：

<figure class="diagram">
  <img src="/assets/diagrams/auto/d067-b49df8.svg" alt="发送信号:">
  <figcaption>图：发送信号:</figcaption>
</figure>


---

## 4. HAL 库的 UART 操作

### 4.1 三种传输模式

| 模式 | API | 特点 |
|------|-----|------|
| **阻塞** (Blocking) | `HAL_UART_Transmit()` / `HAL_UART_Receive()` | 等传输完才返回，卡住 CPU |
| [**中断**](./04-中断与NVIC.md) (Interrupt) | `HAL_UART_Transmit_IT()` / `HAL_UART_Receive_IT()` | 每字节产生中断 |
| [**DMA**](./04-中断与NVIC.md) | `HAL_UART_Transmit_DMA()` / `HAL_UART_Receive_DMA()` | 硬件自动搬运，CPU 零开销 |

在 GSRL 中，UART 接收采用**DMA + 空闲中断**的组合（最优方案）。

### 4.2 DMA + 空闲中断：GSRL 的方案

传统方式每接收一个字节都要产生中断，大量浪费 CPU 时间。

**为什么不用逐字节中断而用 DMA + IDLE？** 以 115200 bps 为例，每字节 10 bit（起始 1 + 数据 8 + 停止 1），每秒产生 11520 次中断。每次中断需要保存/恢复寄存器、执行回调，实际开销远不止 1μs，通常要 5~8μs。这意味着 CPU 仅处理 UART 接收就要消耗 5%~8% 的算力——在 1kHz 控制循环的机器人系统中，这是不可接受的。DMA（直接存储器访问）则完全不同：**传输期间 CPU 零开销**，硬件自动将数据从 UART 寄存器搬运到内存。配合空闲中断（IDLE），一整帧数据只产生一次中断，而非每字节一次。

GSRL 的做法：

```
① 启动 DMA 接收：
   HAL_UARTEx_ReceiveToIdle_DMA(&huart, buffer, maxLen);
   配置 DMA 将收到的数据从 UART 数据寄存器搬运到 buffer
   直到收到 maxLen 个字节或 UART 空闲中断发生

② 一帧数据结束 → UART 空闲中断触发：
   当 RX 线上超过 1 个字节时间没有新数据 → IDLE 中断

③ 回调处理数据：
   HAL_UARTEx_RxEventCallback(huart, actualLen)
   → 用户回调处理 buffer 中的有效数据

④ 重启 DMA 接收：
   HAL_UARTEx_ReceiveToIdle_DMA(...)
   准备接收下一帧
```

<figure class="diagram">
  <img src="/assets/diagrams/auto/d068-50a077.svg" alt="时间轴：">
  <figcaption>图：时间轴：</figcaption>
</figure>


### 4.3 GSRL Driver 实现

`drv_uart.c` 中的完整实现：

```c
void UART_Init(UART_HandleTypeDef *huart, UART_Call_Back rxCallbackFunction, 
               uint16_t rxDataLimit)
{
    UART_Manage_Object_t *uart_obj = UART_Get_Object(huart);
    uart_obj->rxCallbackFunction = rxCallbackFunction;
    uart_obj->rxDataLimit = rxDataLimit;
    // 启动 DMA + 空闲中断接收
    HAL_UARTEx_ReceiveToIdle_DMA(huart, uart_obj->rxBuffer, rxDataLimit);
}

void HAL_UARTEx_RxEventCallback(UART_HandleTypeDef *huart, uint16_t Size)
{
    UART_Manage_Object_t *uart_obj = UART_Get_Object(huart);
    if (uart_obj->rxCallbackFunction != NULL) {
        uart_obj->rxCallbackFunction(uart_obj->rxBuffer, Size);
    }
    // 重启接收
    HAL_UARTEx_ReceiveToIdle_DMA(huart, uart_obj->rxBuffer, uart_obj->rxDataLimit);
}

void HAL_UART_ErrorCallback(UART_HandleTypeDef *huart)
{
    // 错误恢复：重启 DMA 接收
    UART_Manage_Object_t *uart_obj = UART_Get_Object(huart);
    HAL_UARTEx_ReceiveToIdle_DMA(huart, uart_obj->rxBuffer, uart_obj->rxDataLimit);
}
```

---

## 5. UART 在 GSRL 中的实际应用

### 5.1 遥控器数据接收

DR16 遥控接收机通过 UART 输出 18 字节的遥控数据帧（100Hz）。GSRL 中：

```cpp
// 用户任务中初始化
UART_Init(&huart3, dr16ITCallback, 36);

// ISR 中回调
void dr16ITCallback(uint8_t *Buffer, uint16_t Length) {
    dr16.receiveRxDataFromISR(Buffer);
}
```

### 5.2 裁判系统通信

RoboMaster 裁判系统通过 UART 下发比赛状态数据，GSRL 中的 `dvc_referee` 设备对此进行封装。

### 5.3 调试串口

`printf` 重定向到 UART，用于调试输出（通过 USB 虚拟串口或物理 UART 引脚）。

---

## 6. 常见问题与对策

| 问题 | 原因 | 对策 |
|------|------|------|
| 收到乱码 | 波特率不匹配 | 检查收发双方波特率设置 |
| 数据粘包/断帧 | 空闲中断配置不当 | 使用 IDLE 中断自动分帧 |
| DMA 接收中断停止 | 错误中断后未重启 | 在 `ErrorCallback` 中重启 |
| 收发同时进行时丢数据 | 全双工但驱动未处理并发 | 使用独立 TX/RX DMA 通道 |
| 长距离通信不稳定 | TTL 电平抗干扰差 | 改用 RS-485（差分信号） |

---

## 7. 总结

| 要点 | 说明 |
|------|------|
| 异步通信 | 无时钟线，双方约定波特率 |
| 数据帧 | 起始位 + 数据位（5~9）+ 可选校验位 + 停止位 |
| 波特率 | bits/s，常用 115200 |
| 过采样 | 16× 采样，每个 bit 取多次判多数 |
| DMA + IDLE | 最优接收方案，零 CPU 开销 + 自动分帧 |
| 电平标准 | TTL (MCU) ≠ RS-232 (PC)，需转换 |

### 与 GSRL 的关系

GSRL 中 `drv_uart.c` 封装了 DMA + 空闲中断的 UART 接收模式，`dvc_remotecontrol` 和 `dvc_referee` 等设备类依赖此驱动接收数据。遥控器、裁判系统的数据均通过 UART 进入系统。

> 下一篇：[SPI 通信原理与实践](./09-SPI通信原理.md)

> **作者**: [Qing](https://github.com/ZhangChuqing) | **修改日期**: 2026-07-18
