# GSRL 工程结构与运行机制

前面十二章讲解了嵌入式的基础知识。本章将所有知识点串联起来，从宏观到微观，像剥洋葱一样逐层揭示 GSRL 工程的完整架构：一个 [CAN](./11-CAN通信原理.md) 中断信号如何从硬件一路传递到电机的角度闭环控制，最终变成 CAN 总线上的控制指令。

---

## 1. 第一层：工程目录结构

从文件系统看 GSRL 工程的全貌：

<figure class="diagram">
  <img src="/assets/diagrams/auto/d090-cf37d1.svg" alt="GMStdRobotLib / ← 项目根">
  <figcaption>图：GMStdRobotLib / ← 项目根</figcaption>
</figure>


### 1.1 目录职责速查

| 目录 | 职责 | 谁修改 | 谁生成 |
|------|------|--------|--------|
| `CubeMX_BSP/` | 硬件初始化、ISR、[FreeRTOS](./01-嵌入式系统概述与HAL库.md) 配置 | **自动生成**（CubeMX） | CubeMX |
| `GSRL/Driver/` | HAL 外设的高级封装（回调、队列） | 手动编写 | — |
| `GSRL/Device/` | 外设对象的 C++ 封装（Motor、IMU...） | 手动编写 | — |
| `GSRL/Algorithm/` | 数学算法（PID、滤波、姿态解算） | 手动编写 | — |
| `Task/` | 具体的机器人控制任务 | **用户手动编写** | — |

---

## 2. 第二层：构建体系

### 2.1 CMake 构建层次

GMStdRobotLib 使用 CMake 管理编译，三层构建结构：

<figure class="diagram">
  <img src="/assets/diagrams/auto/d091-e231d5.svg" alt="顶层 CMakeLists.txt">
  <figcaption>图：顶层 CMakeLists.txt</figcaption>
</figure>


```cmake
# 顶层 CMakeLists.txt 关键行
add_executable(${CMAKE_PROJECT_NAME})            # 可执行文件
add_subdirectory(CubeMX_BSP/cmake/stm32cubemx)   # HAL 库
add_subdirectory(GSRL)                           # GSRL 库
target_sources(... PRIVATE Task/src/tsk_test.cpp) # 用户任务
target_link_libraries(... stm32cubemx gsrl)       # 链接库
```

### 2.2 库的依赖关系

<figure class="diagram">
  <img src="/assets/diagrams/auto/d092-74781b.svg" alt="Task / ← 用户任务 (可执行文件的一部分)">
  <figcaption>图：Task / ← 用户任务 (可执行文件的一部分)</figcaption>
</figure>


**依赖方向是单向的**：Task → GSRL → HAL。GSRL 不依赖 Task，HAL 不依赖 GSRL。这意味着 GSRL 可以在不同工程中复用。

---

## 3. 第三层：代码分层架构

### 3.1 五层洋葱模型

从内到外，逐层揭示：

<figure class="diagram">
  <img src="/assets/diagrams/auto/d093-7a11e4.svg" alt="5. Task (用户任务) / ← 你的机器人控制逻辑">
  <figcaption>图：5. Task (用户任务) / ← 你的机器人控制逻辑</figcaption>
</figure>


### 3.2 各层的职责边界

| 层 | 职责 | 不负责 | 示例 |
|----|------|--------|------|
| **HAL** | 操作寄存器、启动外设、ISR 入口 | 业务逻辑、数据解析 | `HAL_CAN_AddTxMessage()` |
| **Driver** | 封装 HAL 中断回调、管理 FreeRTOS 队列、注册用户回调 | 解析具体协议 | `CAN_Init(&hcan1, callback)` |
| **Algorithm** | 纯数学计算（PID、滤波、矩阵运算） | 硬件操作 | `myPID.controllerCalculate(set, fb)` |
| **Device** | 协议解析、状态管理、闭环控制接口 | 底层通信细节 | `motor.angleClosedloopControl()` |
| **Task** | 业务逻辑编排、控制循环、状态机 | 底层协议 | 1ms 循环中调用电机控制接口 |

### 3.3 关键依赖规则

1. **上层可以调用下层，下层不能调用上层**
2. **Algorithm 层是纯 C++，不包含任何 HAL 头文件**（`alg_pid.hpp` 只依赖 `gsrl_common.h`）
3. **Device 层使用 Driver 层的接口，不直接调用 HAL API**
4. **Task 层只调用 Device 和 Driver 的初始化函数，不直接操作 HAL 句柄**

> **为什么分离 Driver 层和 Device 层？** Driver 抽象的是通信接口（CAN/UART/SPI），Device 建模的是物理设备（电机/IMU/遥控器）。二者分离后，更换硬件只需要改一层：如果 IMU 从 SPI 接口换成 CAN 接口，只需替换 Driver 而不动 Device 层的姿态解算逻辑；如果从 GM6020 电机换成 DM4310 电机，只需替换 Device 派生类而 Driver 层 CAN 通信代码完全不变。这是经典的关注点分离（Separation of Concerns）——每一层只关心自己的抽象。
>
> **为什么 Algorithm 作为独立层？** PID 控制、滤波器、AHRS 姿态解算都是纯数学运算——它们不依赖任何硬件外设，理论上可以在 PC 上用 gtest 做单元测试，完全不需嵌入式硬件。这种"硬件无关性"还带来了复用性：同一份 PID 代码既用于电机速度环，又用于 IMU 温度控制的加热电阻 PWM，只需传入不同的参数。Algorithm 层不包含任何 HAL 头文件，从根本上杜绝了算法代码与硬件耦合。

---

## 第四层：单个中断的完整旅程

以 **CAN1 收到一帧电机反馈数据** 为例，追踪数据从硬件到控制决策的完整路径：

### 4.1 时间线

<figure class="diagram">
  <img src="/assets/diagrams/auto/d094-95aef4.svg" alt="时刻 T0: 电机发送 CAN 帧（如 GM6020 的反馈帧，ID=0x205）">
  <figcaption>图：时刻 T0: 电机发送 CAN 帧（如 GM6020 的反馈帧，ID=0x205）</figcaption>
</figure>


### 4.2 数据流全景图

<figure class="diagram">
  <img src="/assets/diagrams/auto/d095-65cf79.svg" alt="GM6020">
  <figcaption>图：GM6020</figcaption>
</figure>


---

## 5. 第五层：FreeRTOS 任务与整体运行

### 5.1 系统启动流程（回顾 + 细化）

<figure class="diagram">
  <img src="/assets/diagrams/auto/d096-c25b0d.svg" alt="上电 / 复位">
  <figcaption>图：上电 / 复位</figcaption>
</figure>


> **为什么用 FreeRTOS 而非裸机（Bare Metal）？** 裸机编程需要把所有任务手动编排进一个超级循环，100ms 一次的遥测任务必须和 1ms 的控制计算挤在同一循环里，严重影响实时性。FreeRTOS 为每个任务赋予独立的执行时机和周期——控制任务以 1ms 周期高优先级运行，遥测任务以 100ms 周期低优先级运行，二者互不阻塞。优先级抢占机制保证：只要控制任务就绪，CPU 会立刻暂停当前低优先级任务，保证硬实时约束。

### 5.2 任务循环剖析

以 `tsk_test.cpp` 为例，一个典型的控制任务：

```cpp
extern "C" void test_task(void *argument)
{
    // ──── 初始化阶段（只执行一次）────
    CAN_Init(&hcan1, can1RxCallback);        // 初始化 CAN1 驱动
    UART_Init(&huart3, dr16ITCallback, 36);  // 初始化 UART 驱动

    TickType_t taskLastWakeTime = xTaskGetTickCount();  // 记录起始时间

    // ──── 主循环（1ms 周期）────
    while (1)
    {
        // ① 控制计算
        motor.openloopControl(
            sinf(2 * PI * 0.5f * xTaskGetTickCount() / 1000)
        );

        // ② 发送 CAN 控制帧给电机
        const uint8_t *data = motor.getMotorControlData();
        HAL_CAN_AddTxMessage(&hcan1,
            motor.getMotorControlHeader(), data, &send_mail_box);

        // ③ 等待到下一个 1ms 时刻（精确周期）
        vTaskDelayUntil(&taskLastWakeTime, 1);
    }
}
```

> **为什么任务周期是 1ms（1kHz）？** 大多数机械系统的带宽不超过 100Hz，按照奈奎斯特采样定理，控制频率至少需要 200Hz 才能稳定。1kHz 提供了 5 倍裕量，确保对底盘平衡、云台稳定等快速动态过程有充足的控制带宽。同时，1ms 足够 STM32F407 完成一次完整的姿态解算 + PID 计算 + CAN 通信——电机驱动器内部的电流环以 10~20kHz 运行，我们的 1kHz 位置/速度环是外环，这种分级控制架构是机器人领域的标准做法。
>
> **为什么 GSRL 优先使用静态分配？** 在 1ms 控制循环内，一次 `malloc`/`new` 可能耗时 50μs——这相当于控制周期的 5%，成为不可接受的抖动来源，破坏实时性。静态分配（全局变量、编译期确定大小的数组）在运行时零开销，时序完全可预测，这是硬实时嵌入式系统的铁律。此外，静态分配避免了内存碎片问题——一个运行数月不重启的机器人，堆碎片可能导致原本可用的 2KB 连续内存无法分配。

### 5.3 ISR 与任务的协作

CAN 数据的流向在一个控制周期内：

```
1ms 控制周期内发生的事件:

时刻 0ms (任务开始):
  task: 读取电机当前状态 → PID 计算 → 发送 CAN 控制帧

时刻 0~1ms (任务挂起，等待下一个周期):
  可能发生 1~N 次 CAN 中断:
    → ISR 接收反馈 → 更新 Motor 内部状态
    → 遥控器 UART 中断也可能在这期间触发

时刻 1ms (任务唤醒):
  task: 读取最新状态 → PID 计算 → 发送 CAN 控制帧
  ... 循环往复
```

<figure class="diagram">
  <img src="/assets/diagrams/auto/d097-e916dc.svg" alt="时间线 (1ms 周期):">
  <figcaption>图：时间线 (1ms 周期):</figcaption>
</figure>


**关键认知**：任务周期 1ms，但 CAN 数据的刷新率可能更高（如 1kHz）。任务每次被唤醒时，读到的电机状态是**最新一次** CAN 中断更新的值——不一定是 1ms 前的旧值。这是由 ISR 直接更新 Motor 内部状态实现的。

---

## 6. 第六层：GSRL 在工程中的角色定位

### 6.1 GSRL 是什么

GSRL（GMaster Standard Robot Library）是一个**跨工程复用的机器人控制中间件**。它将 STM32 [HAL](./01-嵌入式系统概述与HAL库.md) 库的底层细节封装为面向对象的 C++ 接口，向上提供：

- 统一的[电机](./07-舵机与电机.md)控制接口（`Motor` 基类 + 多品牌派生类）
- 统一的传感器驱动（[IMU](./12-IMU姿态传感器.md) → `BMI088`）
- 统一的控制算法（`SimplePID`, `CascadePID`, 滤波器）
- 统一的通信驱动（CAN/[UART](./08-UART通信原理.md)/[SPI](./09-SPI通信原理.md) Driver 层）

### 6.2 GSRL 的复用方式

不同兵种工程（步兵、英雄、哨兵、无人机...）都基于 GSRL：

<figure class="diagram">
  <img src="/assets/diagrams/auto/d098-a458ab.svg" alt="GSRL (公共代码，不修改)">
  <figcaption>图：GSRL (公共代码，不修改)</figcaption>
</figure>


> **为什么 GSRL 要做成独立库而非一个大工程？** 步兵、英雄、哨兵、无人机等多种机器人共用同一套电机驱动、IMU 读取和通信协议。将 GSRL 独立为静态库后，一次电机协议的 bug 修复就能自动惠及所有兵种工程，无需手动同步到 8 个项目。每个兵种工程只需编写自己独特的 Task 层控制逻辑（如步兵的底盘运动学 vs 云台跟踪算法），其余通用代码全部来自 GSRL——修改影响范围清晰可控，维护成本大幅降低。

### 6.3 GSRL 与 CubeMX_BSP 的边界

<figure class="diagram">
  <img src="/assets/diagrams/auto/d099-205916.svg" alt="CubeMX_BSP (自动生成)">
  <figcaption>图：CubeMX_BSP (自动生成)</figcaption>
</figure>


**边界规则**：
- `main.c` 通过 `/* USER CODE BEGIN */` 宏让用户在 Task 中写代码
- `stm32f4xx_it.c` 中的 ISR 只调用 `HAL_XXX_IRQHandler`，不做业务逻辑
HAL 的 `__weak` [回调](./05-回调机制与HAL中断处理.md)函数在 GSRL Driver 层被覆盖
- 用户的 Task 代码通过 GSRL 的 C++ API 间接使用硬件

---

## 7. 第七层：从零搭建一个控制任务的步骤

基于 GSRL 开发一个新兵种的典型步骤：

```
Step 1: CubeMX 配置
   - 配置引脚（CAN、UART、SPI、[GPIO](./03-GPIO与高低电平.md)...）
   - 配置[时钟树](./02-时钟树与总线架构.md)
   - 配置 FreeRTOS（任务数量、栈大小、优先级）
   - 生成代码 → CubeMX_BSP/

Step 2: 配置 board_config.h
   - 启用使用的外设宏：
     #define USE_CAN1
     #define USE_USART3
     #define USE_SPI1

Step 3: 编写 Task/ 任务代码
   - 声明电机对象（选择类型 + 设置 CAN ID + 挂载 PID）
   - 声明设备对象（IMU、遥控器）
   - 在 FreeRTOS 任务函数中编写控制循环
   - 实现 CAN/UART 的回调函数

Step 4: 编译 + 烧录
   - cmake --build build
   - openocd -f flash.cfg

Step 5: 调试
   - 通过 UART 打印调试信息
   - 通过 CAN 分析仪查看总线数据
```

---

## 8. 总结：完整知识地图

<figure class="diagram">
  <img src="/assets/diagrams/auto/d100-ba0814.svg" alt="GMStdRobotLib">
  <figcaption>图：GMStdRobotLib</figcaption>
</figure>


### 关键要点

| 概念 | GSRL 中的体现 |
|------|-------------|
| **分层架构** | HAL → Driver → Algorithm/Device → Task |
| **中断处理** | ISR(固定) → HAL分派 → Driver回调(弱定义覆盖) → 用户回调 |
| **上半部/下半部** | ISR 中直接回调 + FreeRTOS 队列延迟 |
| **面向对象封装** | Motor 基类定义接口，派生类适配不同 CAN 协议 |
| **控制器模式** | Controller 抽象接口 → SimplePID / CascadePID 实现（位于 Algorithm 算法层） |
| **代码复用** | GSRL 作为独立库，多工程共享 |
| **实时性保证** | FreeRTOS 任务精准周期 + ISR 快速响应 |

这就是 GSRL 工程的完整图景——从硬件引脚上的一个电平跳变，到电机的精确角度控制，每一层都有清晰的职责边界和调用关系。

> **作者**: [Qing](https://github.com/ZhangChuqing) | **修改日期**: 2026-07-18
