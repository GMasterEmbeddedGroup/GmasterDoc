# SPI 通信原理与实践

SPI（Serial Peripheral Interface，串行外设接口）是一种高速、全双工的同步串行通信协议。GSRL 中 [IMU](./12-IMU姿态传感器.md)（惯性测量单元）的加速度计和陀螺仪均通过 SPI 与 MCU 通信。

> 上一篇：[UART 通信原理与实践](./08-UART通信原理.md)

---

## 1. 概念——高速同步通信

### 1.1 与 UART 的对比

UART 是异步的、全双工的、仅两根数据线。但它的速度受限于[时钟](./02-时钟树与总线架构.md)精度，极限通常在几 Mbps。

SPI 则通过独立的时钟线同步收发双方，可以获得高得多的速率（几十 Mbps），代价是需要更多的连线。

**为什么 SPI 需要 4 根线而 UART 只需 2 根？** UART 省线的代价是双方必须精确匹配波特率——任何一个设备的时钟偏差都会导致采样错误，因此 UART 速度上限通常在几 Mbps。SPI 用一根独立的时钟线（SCLK）消除了这种不确定性：主设备告诉从设备"现在采样"，从设备不需要猜测。这让 SPI 可以达到 10~50 倍于 UART 的速度。同时，CS 信号线使主设备能直接选择从设备，无需在数据流中嵌入地址字节，进一步提高了有效吞吐。

<figure class="diagram">
  <img src="/assets/diagrams/auto/d069-c50581.svg" alt="UART (异步) / SPI (同步)">
  <figcaption>图：UART (异步) / SPI (同步)</figcaption>
</figure>


### 1.2 主从架构

SPI 是严格的**主从（Master-Slave）架构**：

- **Master**（主设备）：产生时钟信号（SCLK），控制通信的发起与结束
- **Slave**（从设备）：响应主设备的时钟，接收或发送数据
- 一个 Master 可以连接多个 Slave，通过 CS（片选）信号选择与哪个 Slave 通信

---

## 2. 物理层——四根信号线

| 信号 | 方向 | 全称 | 说明 |
|------|------|------|------|
| **SCLK** | Master → Slave | Serial Clock | 时钟信号，由 Master 产生 |
| **MOSI** | Master → Slave | Master Out, Slave In | 主设备发送的数据 |
| **MISO** | Slave → Master | Master In, Slave Out | 从设备发送的数据 |
| **CS** (或 SS) | Master → Slave | Chip Select / Slave Select | 低电平有效，选中从设备 |

<figure class="diagram">
  <img src="/assets/diagrams/auto/d070-bc50b6.svg" alt="典型连接拓扑（一主多从）:">
  <figcaption>图：典型连接拓扑（一主多从）:</figcaption>
</figure>


**CS 是关键**：只有 CS 拉低的 Slave 才会响应总线上的 SCLK/MOSI，其余 Slave 的 MISO 引脚处于高阻态（不影响总线）。

**为什么用 CS 引脚而不是像 I2C 那样在数据中发送地址？** 这是硬件简单性与引脚数量的权衡。CS 方式的好处是：不需要在数据流中编码和解码地址，通信帧更短（没有地址字节开销），从设备也不需要地址匹配电路。缺点也很明显——每个从设备需要一根独立的 GPIO，连接 5 个从设备就需要 5 根 CS 线。但在典型嵌入式系统中，SPI 从设备数量通常很少（2~4 个），这个代价完全可接受。

**为什么 MISO 和 MOSI 要分开？** 两条独立的数据线实现了**真正的全双工通信**——主设备和从设备可以在同一个时钟周期内同时发送和接收数据。虽然 UART 也支持全双工（TX 和 RX 各一根），但 SPI 的全双工不需要收发双方匹配波特率，因为时钟由主设备统一提供。在读取 IMU 传感器时，这一特性意味着"发送读命令"和"接收数据"可以在同一次传输中完成——效率极高。

---

## 3. SPI 的四种工作模式（CPOL & CPHA）

SPI 通过两个参数定义时钟极性和数据采样时机：

| 参数 | 全称 | 含义 |
|------|------|------|
| **CPOL** | Clock Polarity | 时钟空闲时的电平：0=低，1=高 |
| **CPHA** | Clock Phase | 数据采样边沿：0=第一个边沿，1=第二个边沿 |

<figure class="diagram">
  <img src="/assets/diagrams/auto/d071-b44545.svg" alt="Mode 0 (CPOL=0, CPHA=0) —— 最常用">
  <figcaption>图：Mode 0 (CPOL=0, CPHA=0) —— 最常用</figcaption>
</figure>


| Mode | CPOL | CPHA | 空闲电平 | 采样边沿 |
|------|------|------|---------|---------|
| 0 | 0 | 0 | 低 | 上升沿（第1个边沿） |
| 1 | 0 | 1 | 低 | 下降沿（第2个边沿） |
| 2 | 1 | 0 | 高 | 下降沿（第1个边沿） |
| 3 | 1 | 1 | 高 | 上升沿（第2个边沿） |

> **关键**：Master 和 Slave 的 CPOL/CPHA 必须匹配，否则数据会在错误的时刻被采样。

**为什么需要四种模式（CPOL/CPHA）？** 不同芯片厂商设计 SPI 接口时有不同的时钟偏好——有些芯片的内部逻辑在时钟上升沿锁存数据，有些在下降沿锁存。CPOL/CPHA 的四种组合为 SPI 提供了**兼容任意芯片的灵活性**。如果没有这四种模式，遇到时钟极性不匹配的芯片就需要外加反相器电路来翻转时钟。这四种模式不是"可选配置"，而是 SPI 协议的核心设计——一次配置正确，即可连接任何 SPI 从设备。

---

## 4. SPI 通信流程

一次完整的 SPI 传输：

```
① Master 拉低 CS
② Master 在 SCLK 上产生时钟
③ Master 和 Slave 同时通过移位寄存器交换数据（全双工）
   - Master 的 MOSI 数据逐位移入 Slave
   - Slave 的 MISO 数据逐位移入 Master
④ 传输完成，Master 拉高 CS
```

<figure class="diagram">
  <img src="/assets/diagrams/auto/d072-fffeda.svg" alt="Master 移位寄存器 / Slave 移位寄存器">
  <figcaption>图：Master 移位寄存器 / Slave 移位寄存器</figcaption>
</figure>


**重要特性**：SPI 的发送和接收是**同步进行的**。即使你只想读数据，也必须发送同样数量的字节（通常是 0x00 或 0xFF 作为"空字节"），才能把 MISO 上的数据"时钟出来"。

---

## 5. HAL 库的 SPI 操作

### 5.1 CubeMX 配置

在 CubeMX 中配置 SPI 需要关注：

| 参数 | 含义 | GSRL 典型值 |
|------|------|------------|
| Mode | 主/从模式 | Full-Duplex Master |
| NSS | 硬件/软件片选 | Software（用 GPIO 模拟） |
| Data Size | 数据帧大小 | 8 Bits |
| CPOL / CPHA | 时钟模式 | 根据从设备数据手册 |
| Baud Rate Prescaler | 时钟分频 | 影响 SCLK 频率 |
| First Bit | 先发 MSB 还是 LSB | MSB First |

### 5.2 传输模式

HAL 提供四种 SPI 传输 API：

```c
// 阻塞模式：发送 + 接收（分别调用）
HAL_SPI_Transmit(&hspi1, txData, len, timeout);
HAL_SPI_Receive(&hspi1, rxData, len, timeout);

// 阻塞模式：全双工（同时收发，效率高）
HAL_SPI_TransmitReceive(&hspi1, txData, rxData, len, timeout);

// 中断模式：全双工
HAL_SPI_TransmitReceive_IT(&hspi1, txData, rxData, len);

// DMA 模式：全双工（GSRL 推荐，零 CPU 开销）
HAL_SPI_TransmitReceive_DMA(&hspi1, txData, rxData, len);
```

### 5.3 GSRL Driver 封装

`drv_spi.c` 对 HAL SPI API 做了统一封装，并实现了 HAL 回调：

```c
// 初始化 SPI 驱动
void SPI_Init(SPI_HandleTypeDef *hspi, SPI_Call_Back rxCallbackFunction);

// DMA 全双工传输
HAL_StatusTypeDef SPI_TransmitReceive_DMA(SPI_HandleTypeDef *hspi,
                                          uint8_t *pTxData, uint16_t exchangeDataLength);

// HAL 传输完成回调 → 调用用户注册的回调
void HAL_SPI_TxRxCpltCallback(SPI_HandleTypeDef *hspi)
{
    SPI_Manage_Object_t *spi_obj = SPI_Get_Object(hspi);
    if (spi_obj->rxCallbackFunction != NULL) {
        spi_obj->rxCallbackFunction(spi_obj->rxBuffer, spi_obj->exchangeDataLength);
    }
}
```

---

## 6. GSRL 中的 SPI 应用：BMI088 IMU

### 6.1 BMI088 的 SPI 接口

BMI088 是一款 6 轴 IMU（3 轴加速度计 + 3 轴陀螺仪），其加速度计和陀螺仪是**独立的两颗芯片**，各自有独立的 SPI 接口和 CS 引脚：

<figure class="diagram">
  <img src="/assets/diagrams/auto/d073-c4a881.svg" alt="STM32 / BMI088">
  <figcaption>图：STM32 / BMI088</figcaption>
</figure>


### 6.2 逐寄存器读写

BMI088 使用典型的 SPI 寄存器读写协议：

```
读寄存器格式（发送 2 字节，接收 1 字节有用数据）:
  Byte0: [0│R/W=1│A6 A5 A4 A3 A2 A1 A0]   ← 寄存器地址，bit7=1 表示读
  Byte1: 任意值（用于把数据时钟出来）
  收到:  Byte1 = 寄存器的值

写寄存器格式（发送 2 字节）:
  Byte0: [0│R/W=0│A6 A5 A4 A3 A2 A1 A0]   ← 寄存器地址，bit7=0 表示写
  Byte1: 要写入的值
```

### 6.3 GSRL 中的 IMU 对象

`BMI088` 类（`dvc_imu.hpp`）封装了 SPI 通信细节：

```cpp
struct SPIConfig {
    SPI_HandleTypeDef *hspi;      // SPI 句柄（如 &hspi1）
    GPIO_TypeDef *csGPIOGroup;    // CS 引脚 GPIO 端口
    uint16_t csGPIOPin;           // CS 引脚编号
};

class BMI088 : public IMU
{
    SPIConfig m_accelSPIConfig;   // 加速度计 SPI 配置
    SPIConfig m_gyroSPIConfig;    // 陀螺仪 SPI 配置

    // 内部实现
    void readSingleReg(const SPIConfig &cfg, uint8_t reg, uint8_t &rxData);
    void readMultiReg(const SPIConfig &cfg, uint8_t reg, uint8_t *pRxData, uint8_t len);
};
```

读取寄存器的实际过程：

```c
void BMI088::readSingleReg(const SPIConfig &cfg, uint8_t reg, uint8_t &rxData)
{
    uint8_t txData[2] = {static_cast<uint8_t>(reg | 0x80), 0xFF};  // 读命令
    uint8_t rxDataBuf[2];

    HAL_GPIO_WritePin(cfg.csGPIOGroup, cfg.csGPIOPin, GPIO_PIN_RESET);  // 拉低 CS
    HAL_SPI_TransmitReceive(cfg.hspi, txData, rxDataBuf, 2, 100);       // 全双工传输
    HAL_GPIO_WritePin(cfg.csGPIOGroup, cfg.csGPIOPin, GPIO_PIN_SET);    // 拉高 CS

    rxData = rxDataBuf[1];  // 第 2 个字节是有效的寄存器值
}
```

---

## 7. SPI 对比 UART

| 特性 | SPI | UART |
|------|-----|------|
| 时钟 | 独立时钟线（同步） | 无时钟（异步） |
| 连线数 | 4 根（SCLK/MOSI/MISO/CS） | 2 根（TX/RX） |
| 拓扑 | 一主多从 | 一对一 |
| 最大速率 | 几十 Mbps | 几 Mbps |
| 全双工 | 是 | 是 |
| 从设备选择 | CS 信号 | 地址协议（如 RS-485 地址位） |
| 应用 | IMU、Flash、SD 卡 | 调试、遥控器、GPS |

---

## 8. 总结

| 要点 | 说明 |
|------|------|
| 同步通信 | 独立的 SCLK 时钟线，收发同步 |
| 四根信号线 | SCLK + MOSI + MISO + CS |
| 全双工 | 发送和接收同时进行 |
| CPOL/CPHA | 定义时钟极性和采样边沿，共 4 种模式 |
| CS 信号 | 低电平选中从设备，一主多从的关键 |
| GSRL 应用 | SPI1/SPI2 连接 BMI088 加速度计+陀螺仪 |

### 与 GSRL 的关系

GSRL 的 BMI088 IMU 通过 SPI 通信，`drv_spi.c` 封装了 HAL SPI API，`dvc_imu.hpp` 中的 `BMI088` 类在 SPI 驱动之上实现了寄存器的读写、校准和姿态解算。

> 下一篇：[I2C 通信原理与实践](./10-I2C通信原理.md)

> **作者**: [Qing](https://github.com/ZhangChuqing) | **修改日期**: 2026-07-18
