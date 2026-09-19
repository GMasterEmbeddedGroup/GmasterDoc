# 嵌入式系统概述与 HAL 库

介绍嵌入式系统的基本概念、MCU 的运作方式，以及 STM32 HAL 库在开发体系中的位置与设计思想。

---

## 1. 什么是嵌入式系统

> **快速导航**：本文提到的概念均有专题讲解——[GPIO](./03-GPIO与高低电平.md)、[UART](./08-UART通信原理.md)、[SPI](./09-SPI通信原理.md)、[I2C](./10-I2C通信原理.md)、[CAN](./11-CAN通信原理.md)、[时钟树](./02-时钟树与总线架构.md)、[回调机制](./05-回调机制与HAL中断处理.md)。

### 1.1 类比：单片机 vs PC

一台 PC 上运行着操作系统（Windows / Linux），可以同时打开浏览器、写代码、听音乐——它是一个**通用计算平台**。

嵌入式系统则不同：它只做一件事，但要做到极致——实时、可靠、低功耗。你的微波炉、无人机飞控、汽车 ECU 都是嵌入式系统。

<figure class="diagram">
  <img src="/assets/diagrams/auto/d028-d35822.svg" alt="PC (通用计算)">
  <figcaption>图：PC (通用计算)</figcaption>
</figure>


### 1.2 本质

嵌入式系统的核心是一块**微控制器（MCU, Microcontroller Unit）**。MCU 将 CPU、内存（RAM/Flash）、外设（[GPIO](./03-GPIO与高低电平.md)、[UART](./08-UART通信原理.md)、[SPI](./09-SPI通信原理.md) 等）集成在同一块芯片上，形成一个自给自足的计算单元。

GSRL 项目所用的 STM32F407 基于 **ARM Cortex-M4** 内核，主频 168MHz，属于中高性能 MCU。GSRL_H7 所用的 STM32H7 系列则基于 **Cortex-M7**，主频可达 480MHz。

---

## 2. MCU 的运作方式

### 2.1 三大核心组成

<figure class="diagram">
  <img src="/assets/diagrams/auto/d029-e743aa.svg" alt="STM32 MCU">
  <figcaption>图：STM32 MCU</figcaption>
</figure>


- **内核（Core）**：执行指令，处理运算。Cortex-M4 支持 DSP 指令和单精度浮点（FPU），这对机器人控制中的 PID 计算、姿态解算至关重要。
- **内存**：Flash 存程序，RAM 存运行时数据。嵌入式系统内存极度受限（192KB RAM），需要精打细算。
- **外设（Peripheral）**：MCU 与外部世界交互的桥梁。GPIO 控制引脚电平，UART/SPI/[I2C](./10-I2C通信原理.md)/[CAN](./11-CAN通信原理.md) 负责通信，TIM 产生 PWM 驱动电机。

### 2.2 启动流程

<figure class="diagram">
  <img src="/assets/diagrams/auto/d030-3433d1.svg" alt="上电 → 复位向量 → SystemInit() → main()">
  <figcaption>图：上电 → 复位向量 → SystemInit() → main()</figcaption>
</figure>


对应工程中的 `CubeMX_BSP/Src/main.c`:

```c
int main(void)
{
    HAL_Init();                      // 初始化 HAL 库
    SystemClock_Config();            // 配置系统时钟 168MHz
    MX_GPIO_Init();                  // 初始化 GPIO
    MX_DMA_Init();
    MX_CAN1_Init();                  // 初始化 CAN1
    MX_SPI1_Init();                  // 初始化 SPI1
    // ... 其他外设初始化
    osKernelInitialize();            // FreeRTOS 内核初始化
    MX_FREERTOS_Init();              // 创建任务
    osKernelStart();                 // 启动调度器
    while (1) {}                     // 永远不会执行到这里
}
```

### 2.3 代码如何变成运行的程序

<figure class="diagram">
  <img src="/assets/diagrams/auto/d031-ea72e8.svg" alt="2.3 代码如何变成运行的程序">
  <figcaption>图：2.3 代码如何变成运行的程序</figcaption>
</figure>


---

## 3. HAL 库是什么

### 3.1 问题的提出

直接操作 STM32 的寄存器可以控制外设，例如让 PA5 引脚输出高电平：

```c
// 寄存器方式——直接操作地址
*(volatile uint32_t *)0x40020014 |= (1 << 5);  // GPIOA BSRR 寄存器
```

这种方式的问题：
- **不可读**：`0x40020014` 是什么？不查手册完全不知道。
- **不可移植**：STM32F4 和 STM32H7 的寄存器地址不同，同样的功能需要写两份代码。
- **容易出错**：位操作稍有不慎就会影响其他引脚。

### 3.2 HAL 的解决方案

HAL（Hardware Abstraction Layer，硬件抽象层）是 ST 官方提供的一套函数库，为所有 STM32 外设提供统一的 API：

```c
// HAL 方式——语义清晰
HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_SET);  // PA5 输出高电平

// 同样的 API 在 STM32F4、STM32H7 上都可用（重新编译即可）
```

### 3.3 HAL 库的层次化设计

<figure class="diagram">
  <img src="/assets/diagrams/auto/d032-bb437d.svg" alt="用户应用程序 (Task / ) / ← 你的业务逻辑">
  <figcaption>图：用户应用程序 (Task / ) / ← 你的业务逻辑</figcaption>
</figure>


### 3.4 HAL 的核心设计模式

HAL 库围绕两个核心概念组织 API：

| 概念 | 含义 | 示例 |
|------|------|------|
| **句柄（Handle）** | 代表一个外设实例的结构体，包含配置和状态 | `CAN_HandleTypeDef hcan1` |
| **[回调（Callback）](./05-回调机制与HAL中断处理.md)** | 外设事件发生时 HAL 自动调用的函数 | `HAL_CAN_RxFifo0MsgPendingCallback()` |

初始化外设的典型模式：

```c
// 1. 声明句柄（通常在 CubeMX 生成的代码中）
CAN_HandleTypeDef hcan1;

// 2. CubeMX 生成初始化函数，配置句柄的参数
void MX_CAN1_Init(void)
{
    hcan1.Instance = CAN1;
    hcan1.Init.Prescaler = 7;
    hcan1.Init.Mode = CAN_MODE_NORMAL;
    // ... 更多配置
    HAL_CAN_Init(&hcan1);  // 调用 HAL API 完成初始化
}

// 3. 用户代码中使用句柄操作外设
HAL_CAN_AddTxMessage(&hcan1, &txHeader, txData, &mailbox);
```

---

## 4. CubeMX 的角色

STM32CubeMX 是一个图形化配置工具，通过它你可以：

- **选引脚**：指定 PA9 做 USART1_TX，PA10 做 USART1_RX
- **配[时钟](./02-时钟树与总线架构.md)**：设定 HSE → PLL → 168MHz 的时钟路径
- **配外设**：设定 CAN 的波特率、UART 的波特率、SPI 的模式
- **配 FreeRTOS**：创建任务、队列、信号量

CubeMX 最终生成一整套初始化代码，放在 `CubeMX_BSP/` 目录下。**这些代码不应手动修改**，因为重新生成会覆盖你的改动。所有用户自定义代码应写在 `/* USER CODE BEGIN */` 和 `/* USER CODE END */` 之间。

---

## 5. FreeRTOS 概述

GSRL 使用 FreeRTOS 作为实时操作系统。相对于裸机编程（Bare Metal），FreeRTOS 提供了：

- **任务调度**：多个任务按优先级轮流执行，看起来像"同时运行"
- **任务间通信**：队列、信号量、互斥锁
- **软件定时器**：不占用硬件定时器资源

<figure class="diagram">
  <img src="/assets/diagrams/auto/d033-39b2b8.svg" alt="裸机（Bare Metal）:">
  <figcaption>图：裸机（Bare Metal）:</figcaption>
</figure>


GSRL 中的任务定义在 `CubeMX_BSP/Src/freertos.c` 中：

```c
osThreadId_t testHandle;
const osThreadAttr_t test_attributes = {
    .name = "test",
    .stack_size = 128 * 4,           // 栈大小 512 字节
    .priority = (osPriority_t) osPriorityNormal,  // 优先级
};

// 在 MX_FREERTOS_Init() 中创建：
testHandle = osThreadNew(test_task, NULL, &test_attributes);
```

---

## 6. 总结

| 要点 | 说明 |
|------|------|
| MCU | CPU + 内存 + 外设 集成在单芯片上 |
| STM32F407 | Cortex-M4 内核，168MHz，192KB RAM |
| HAL 库 | ST 提供的硬件抽象层，屏蔽寄存器细节 |
| 句柄 | 代表外设实例的结构体，HAL API 的核心参数 |
| CubeMX | 图形化配置工具，生成初始化代码 |
| FreeRTOS | 轻量实时操作系统，负责任务调度 |
| 启动流程 | 上电 → 时钟初始化 → 外设初始化 → FreeRTOS 接管 |

### 与 GSRL 的关系

GSRL 正是基于 HAL 库分层构建的：Driver 层封装 HAL API，Device 层使用 Driver 层的接口控制具体设备，Algorithm 层提供数学和控制算法。理解 HAL 库的句柄与回调机制，是理解整个 GSRL 代码运转方式的基础。

> 下一篇：[时钟树与总线架构](./02-时钟树与总线架构.md)

> **作者**: [Qing](https://github.com/ZhangChuqing) | **修改日期**: 2026-07-18
