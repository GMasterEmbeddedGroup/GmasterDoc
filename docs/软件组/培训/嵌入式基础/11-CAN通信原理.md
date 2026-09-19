# CAN 通信原理与实践

CAN（Controller Area Network，控制器局域网）是 RoboMaster 机器人中最核心的通信协议。所有[电机](./07-舵机与电机.md)、电调、超级电容等设备均通过 CAN 总线与主控通信。理解 CAN 的工作原理对于调试电机通信问题至关重要。

> 上一篇：[I2C 通信原理与实践](./10-I2C通信原理.md)

---

## 1. 概念——为什么需要 CAN

### 1.1 UART/SPI/I2C 的局限性

在机器人场景中，用传统协议连接多个执行器存在明显问题：

<figure class="diagram">
  <img src="/assets/diagrams/auto/d080-348a67.svg" alt="UART 方案:">
  <figcaption>图：UART 方案:</figcaption>
</figure>


CAN 总线解决了这些问题：

- **两根线连接所有设备**（差分信号 CAN_H + CAN_L）
- **多主架构**：任何节点都可以主动发送
- **仲裁机制**：ID 小的帧优先发送
- **硬件错误检测**：CRC、位填充、帧格式检查
- **抗干扰能力强**：差分传输，适用于电机等强电磁干扰环境

**为什么机器人/车辆领域必须用 CAN？** 最关键的原因在于 CAN 的**硬件级错误处理**：当电机产生的电磁干扰（EMI）导致某一帧数据损坏时，CAN 控制器会在硬件层自动检测出 CRC 错误或位错误，并**自动重发**该帧——整个过程不需要软件介入。UART、SPI、I2C 则完全不同：它们没有硬件重传机制，数据损坏就是永久丢失，软件层必须自己实现校验和重传。在机器人中，8 个大功率电机同时运转产生的 EMI 足以轻易破坏单端信号——只有 CAN 的差分信号 + 硬件重传组合能保证可靠通信。

### 1.2 CAN 总线的物理拓扑

<figure class="diagram">
  <img src="/assets/diagrams/auto/d081-f49f76.svg" alt="MCU / 电机 1 / 电机 2 / 电机 3">
  <figcaption>图：MCU / 电机 1 / 电机 2 / 电机 3</figcaption>
</figure>


**两个关键物理要素**：

1. **差分信号**：CAN_H 和 CAN_L 电压差表示逻辑值。共模干扰同时影响两根线，差模值不变。
2. **终端电阻**（120Ω）：在总线两端并联，防止信号反射。没有它高速通信会失败。

**为什么差分信号能抗干扰？** 电机运转时产生的电磁噪声会同时耦合到 CAN_H 和 CAN_L 两根线上——这叫**共模干扰**。差分信号的精妙之处在于：接收端只关心 CAN_H 减去 CAN_L 的**差值**，而共模噪声在两根线上产生的电压偏移完全相同，做减法后恰好抵消。换句话说，即便每根线上的噪声高达数伏特，只要两根线上的噪声幅度一致，差模信号就丝毫不受影响。单端信号（UART/SPI/I2C）没有这种保护机制——一根信号线上的噪声直接就是噪声。

**为什么必须有终端电阻？** 从传输线理论来看，电信号在导线末端会发生**反射**——就像水波碰到墙壁会反弹一样。对于 CAN 的 1Mbps 速率，1-bit 宽度约 1μs，而一条 2 米长的总线上信号反射返回时间约 10ns——恰好落在同一位的时间内，会叠加在原始信号上造成畸变。总线的 120Ω 终端电阻相当于"吸收器"，将到达末端的信号能量吸收掉而不是反射回去。没有终端电阻，信号完整性会完全崩溃——这就是为什么测 CAN 通信问题时第一件事就是拿万用表量 CAN_H 和 CAN_L 之间的电阻（两个 120Ω 并联应为 60Ω）。

**为什么终端电阻必须在两端而不是一端？** 一条总线的两个端点都会产生反射，所以两端各需要一个电阻来吸收能量。如果只装一端，另一端的反射仍然会破坏信号。

<figure class="diagram">
  <img src="/assets/diagrams/auto/d082-24083d.svg" alt="差分信号示意:">
  <figcaption>图：差分信号示意:</figcaption>
</figure>


---

## 2. CAN 数据帧格式

标准 CAN 2.0A 使用 11-bit ID。GSRL 中我们主要使用这种格式：

<figure class="diagram">
  <img src="/assets/diagrams/auto/d083-5a6fff.svg" alt="CAN 标准数据帧 (CAN 2.0A):">
  <figcaption>图：CAN 标准数据帧 (CAN 2.0A):</figcaption>
</figure>


| 字段 | 含义 | 说明 |
|------|------|------|
| **SOF** | Start of Frame | 1 bit 显性位，表示帧开始 |
| **ID** | Identifier | 11-bit（标准帧）或 29-bit（扩展帧），决定优先级和数据含义 |
| **RTR** | Remote Transmission Request | 0=数据帧，1=远程帧（请求对方发送数据） |
| **IDE** | Identifier Extension | 0=标准帧(11-bit ID)，1=扩展帧(29-bit ID) |
| **DLC** | Data Length Code | 数据长度，0~8 字节 |
| **Data** | Data Field | 实际数据，0~8 字节 |
| **CRC** | Cyclic Redundancy Check | 15-bit CRC 校验 |
| **ACK** | Acknowledgment | 接收方应答，至少一个节点收到就确认 |
| **EOF** | End of Frame | 7 bit 隐性位 |

### 2.1 ID 的双重职能

CAN 的 ID 既是**优先级**也是**标识符**：

- **仲裁**：多个节点同时发送时，ID 小的帧"赢"。显性位（0）覆盖隐性位（1）。
- **过滤**：接收方根据 ID 决定是否接收该帧。

**为什么 CAN ID 同时承担优先级功能？** 这是 CAN 协议最巧妙的设计之一，专为实时系统而生。当多个节点同时发送时，它们各自在总线上输出自己的 ID 位，同时监控总线电平。由于显性位（逻辑 0）会覆盖隐性位（逻辑 1），**ID 数值越小的帧自动赢得仲裁**——整个过程不需要任何中央调度器，零延迟完成优先级判决。这意味着紧急消息（如电机急停，ID=0x001）可以在任何时刻抢占总线，而低优先级消息（如温度上报，ID=0x500）会自动退让。相比之下，I2C 等基于地址的协议无法在硬件层实现这种优先级机制——如果两个设备同时想说话，它们需要复杂的软件仲裁协议。

```
仲裁示例（两个节点同时发送）:

节点A ID: 0 0 1 1 0 0 1 0 1 0 0  (0x194)
节点B ID: 0 0 1 1 0 0 1 0 1 0 1  (0x195)
总线:     0 0 1 1 0 0 1 0 1 0 0 (节点A获胜！)

前10位完全相同，第11位：
- 节点A发送 0 (显性) → 覆盖节点B的 1 (隐性)
- 节点B检测到自己发的1被拉成了0 → 知道自己输了 → 停止发送
```

---

## 3. RoboMaster 中的 CAN 通信规范

### 3.1 大疆电机 CAN 协议

以 GM6020 为例，大疆电机使用标准 CAN 帧（11-bit ID），1Mbps [波特率](./02-时钟树与总线架构.md)：

**控制帧**（MCU → 电机，ID = 0x1FF + 控制组）：

| 数据字节 | 含义 |
|---------|------|
| Data[0:1] | 电机1 控制电压 (-30000 ~ +30000) |
| Data[2:3] | 电机2 控制电压 |
| Data[4:5] | 电机3 控制电压 |
| Data[6:7] | 电机4 控制电压 |

一个控制帧可以携带**最多 4 个电机的电压指令**（"一控多"模式）。

**反馈帧**（电机 → MCU，ID = 0x204 + 电机序号）：

| 数据字段 | 含义 | 范围 |
|---------|------|------|
| Data[0:1] | 机械角度（编码器值） | 0 ~ 8191 (13-bit) |
| Data[2:3] | 转速 (RPM) | -10000 ~ +10000 |
| Data[4:5] | 实际转矩电流 | -16384 ~ +16384 |
| Data[6] | 温度 | 0 ~ 127 ℃ |

### 3.2 达妙电机 MIT 协议

达妙 DM4310 使用 MIT 模式（力矩控制）：

**控制帧**（ID = masterID << 8 | motorID）：

```
Data[0:1] = 期望位置 (float → uint16, PMAX 归一化)
Data[2:3] = 期望速度 (float → uint16, VMAX 归一化)
Data[4:5] = 前馈力矩 (float → uint16, TMAX 归一化)
Data[6:7] = KP + KD
```

**反馈帧**（ID = 0x300 + motorID）：

```
Data[0:1] = 当前位置
Data[2:3] = 当前速度
Data[4:5] = 当前力矩
Data[6]   = 温度 (MOSFET)
Data[7]   = 温度 (线圈) + 错误状态
```

---

## 4. HAL 库的 CAN 操作

### 4.1 基本配置

在 CubeMX 中配置 CAN：

| 参数 | 含义 | RoboMaster 典型值 |
|------|------|-------------------|
| Bit Rate | 波特率 | 1 Mbps |
| Prescaler | 时钟分频 | 7 (APB1=42MHz → 42/(1+5+1)/7=1Mbps) |
| Time Quanta | Bit 时间分段 | BS1=5, BS2=2, SJW=1 |
| Mode | 工作模式 | Normal |

### 4.2 发送和接收

```c
// 发送 CAN 消息
CAN_TxHeaderTypeDef txHeader;
txHeader.StdId = 0x1FF;       // 标准帧 ID
txHeader.ExtId = 0;           // 不用扩展帧
txHeader.IDE = CAN_ID_STD;    // 标准帧
txHeader.RTR = CAN_RTR_DATA;  // 数据帧
txHeader.DLC = 8;             // 数据长度 8 字节

uint8_t txData[8] = {0};
uint32_t txMailbox;
HAL_CAN_AddTxMessage(&hcan1, &txHeader, txData, &txMailbox);

// 接收 CAN 消息（在 HAL 回调中）
void HAL_CAN_RxFifo0MsgPendingCallback(CAN_HandleTypeDef *hcan)
{
    CAN_RxHeaderTypeDef rxHeader;
    uint8_t rxData[8];
    HAL_CAN_GetRxMessage(hcan, CAN_RX_FIFO0, &rxHeader, rxData);
    // rxHeader.StdId → 判断是哪个电机的反馈
    // rxData → 解析电机状态
}
```

---

## 5. GSRL 的 CAN 驱动设计

### 5.1 全通过滤器 + 软件过滤

GSRL 将 CAN 滤波器配置为"全通"模式（接收所有 ID 的帧），过滤工作放在软件层做：

```c
// drv_can.c: 全通过滤器初始化
static void can_all_pass_filter_init(CAN_HandleTypeDef *hcan)
{
    CAN_FilterTypeDef can_filter_st = {0};
    can_filter_st.FilterMode = CAN_FILTERMODE_IDMASK;
    can_filter_st.FilterScale = CAN_FILTERSCALE_32BIT;
    can_filter_st.FilterIdHigh = 0x0000;
    can_filter_st.FilterIdLow = 0x0000;
    can_filter_st.FilterMaskIdHigh = 0x0000;
    can_filter_st.FilterMaskIdLow = 0x0000;
    // Mask 全为 0 → 不关心 ID → 接收所有帧
    can_filter_st.FilterFIFOAssignment = CAN_FilterFIFO0;
    can_filter_st.FilterActivation = CAN_FILTER_ENABLE;
    HAL_CAN_ConfigFilter(hcan, &can_filter_st);
}
```

为什么这样做？因为 RoboMaster 比赛中有多种不同 ID 的设备（电机、裁判系统、超级电容等），硬件滤波器数量有限，用软件过滤更灵活。

### 5.2 双路径数据分发

CAN 驱动同时提供两条数据处理路径：

```c
void HAL_CAN_RxFifo0MsgPendingCallback(CAN_HandleTypeDef *hcan)
{
    can_rx_message_t s_rx_msg;
    HAL_CAN_GetRxMessage(hcan, CAN_RX_FIFO0, &s_rx_msg.header, s_rx_msg.data);

    // 路径 1: FreeRTOS 队列（任务线程延迟处理）
    xQueueSendToBackFromISR(canRxQueueHandle, &s_rx_msg, &woken);

    // 路径 2: 用户注册的回调（ISR 中直接处理）
    CAN_Manage_Object_t *can_obj = CAN_Get_Object(hcan);
    if (can_obj->rxCallbackFunction != NULL) {
        can_obj->rxCallbackFunction(&s_rx_msg);
    }

    portYIELD_FROM_ISR(woken);
}
```

### 5.3 离线检测

GSRL 的 Motor 类通过**反馈序列号**判断电机是否离线：

```cpp
// 每次收到反馈帧，序列号递增
// 如果连续 N 次未收到新数据，判定电机离线
bool decodeCanRxMessageFromISR(const can_rx_message_t *rxMessage) {
    m_motorLastFeedbackSequence = m_motorFeedbackSequence;
    m_motorFeedbackSequence = rxMessage->header.StdId & 0x07;  // 或其他序列号字段
    // 判断: 连续多帧未更新 → 离线
}
```

---

## 6. CAN 对比其他协议

| 特性 | CAN | [UART](./08-UART通信原理.md) | [SPI](./09-SPI通信原理.md) | [I2C](./10-I2C通信原理.md) |
|------|-----|------|-----|-----|
| 信号类型 | 差分 | 单端 | 单端 | 单端 |
| 最大节点数 | 理论无限（实际受驱动能力限制） | 点对点 | 一主多从 | 127 |
| 多主 | 支持 | 不支持 | 不支持 | 支持 |
| 硬件错误检测 | CRC、位填充、帧检查 | 可选校验位 | 无 | 无 |
| 自动重发 | 有（硬件） | 无 | 无 | 无 |
| 典型速率 | 1Mbps | 115200bps | 10Mbps+ | 400kbps |
| 数据帧长 | 0~8 字节 | 无固定帧 | 无固定帧 | 无固定帧 |
| 抗干扰 | 强 | 弱 | 弱 | 弱 |

---

## 7. 常见问题与调试

| 问题 | 原因 | 排查方法 |
|------|------|---------|
| 电机无反馈 | 终端电阻缺失 | 用万用表测 CAN_H-CAN_L 电阻，应为 60Ω（两个 120Ω 并联） |
| 数据乱码 | 波特率不匹配 | 确认所有节点波特率一致（RoboMaster 为 1Mbps） |
| 间歇通信失败 | 信号反射 | 检查终端电阻，缩短分支线长度 |
| 电机 ID 冲突 | 两个电机同 ID | 每个电机 ID 必须唯一，通过电调软件修改 |
| CAN [中断](./04-中断与NVIC.md)风暴 | 滤波器未配置 | 检查滤波器设置，限制接收范围 |
| HAL_CAN 错误回调频繁触发 | 总线连接不良 | 检查接线，确保 CAN_H/CAN_L 未接反 |

---

## 8. 总结

| 要点 | 说明 |
|------|------|
| 差分信号 | CAN_H 和 CAN_L 差值表示数据，抗干扰强 |
| 显性/隐性 | 显性(0)覆盖隐性(1)，实现非破坏性仲裁 |
| ID 仲裁 | 同时发送时，ID 小的帧优先 |
| 数据帧 | 0~8 字节有效载荷，大疆一控多模式同时发 4 电机指令 |
| 终端电阻 | 总线两端各 120Ω，消除信号反射 |
| GSRL CAN 驱动 | 全通过滤 + 双路径分发 + 离线检测 |

### 与 GSRL 的关系

CAN 是 GSRL 中最重要的通信协议。`drv_can.c` 封装了 HAL CAN 的初始化、过滤、收发和中断处理。所有 `Motor` 派生类（GM6020、M3508、DM4310 等）通过 CAN 接收反馈和发送控制指令。CAN1 通常挂载底盘电机，CAN2 挂载云台电机——两个 CAN 外设独立工作，避免了总线负载过高。

> 下一篇：[IMU 姿态传感器](./12-IMU姿态传感器.md)

> **作者**: [Qing](https://github.com/ZhangChuqing) | **修改日期**: 2026-07-18
