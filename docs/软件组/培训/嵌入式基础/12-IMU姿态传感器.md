# IMU 姿态传感器

IMU（Inertial Measurement Unit，惯性测量单元）是机器人感知自身姿态的核心传感器。GSRL 使用 BMI088（6 轴 IMU）+ IST8310（3 轴磁力计）组成 9 轴姿态测量系统。本章从 MEMS 传感器原理讲起，一直到 GSRL 中完整的姿态解算数据流。

> 上一篇：[CAN 通信原理与实践](./11-CAN通信原理.md)

---

## 1. 概念——IMU 如何感知运动

### 1.1 加速度计——测"比力"

加速度计测量的不是"加速度"，而是**比力（Specific Force）**——即除去重力之外的所有外力产生的加速度。

```
静止平放时：
  加速度计测量值 = [0, 0, +1g]  ← 不是"向上的加速度"，而是支撑力抵消重力的结果

自由落体时：
  加速度计测量值 = [0, 0, 0]     ← 没有支撑力，真正失重

向前加速时：
  加速度计测量值 = [+a, 0, +1g]  ← X 轴测到向前的惯性力
```

MEMS 加速度计的物理原理：微机械结构中的质量块在加速度作用下发生位移，通过电容变化检测位移量。

<figure class="diagram">
  <img src="/assets/diagrams/auto/d084-a5bd14.svg" alt="简化模型:">
  <figcaption>图：简化模型:</figcaption>
</figure>


> **为什么不能只用加速度计测角度？** 加速度计测量的是比力（重力 + 运动加速度的合力），而非纯重力方向。当机器人向前加速时，加速度计会"看到"一个斜向后的"伪重力"，误以为机体发生了倾斜。例如，机器人以 1g 向前加速时，加速度计读数相当于向后倾斜了 45°——但机体实际上是水平的。陀螺仪直接测量旋转角速度，不受线性加速度干扰，因此不存在这个问题。
>

### 1.2 陀螺仪——测角速度

陀螺仪测量的是绕各轴的**旋转角速度**（单位：°/s 或 rad/s），而非角度。

```
陀螺仪输出 = [ωx, ωy, ωz]  绕 X/Y/Z 轴的角速度

对时间积分得到角度变化:
  Δθ = ∫ ω dt
```

MEMS 陀螺仪利用**科里奥利力（Coriolis Force）**原理：一个振动的质量块在旋转时受到垂直于振动方向和旋转轴的力，检测这个力即可得到角速度。

> **为什么不能只用陀螺仪测角度？** 陀螺仪通过积分角速度得到角度，但微小的零偏误差（如 0.1°/s）会在积分后持续累积：1 分钟累积 6° 误差，10 分钟就是 60°——完全错误。而且这个误差会随时间无限增长。加速度计和磁力计虽然瞬时有噪声，但它们提供的是绝对参考（重力方向永远指向地心、地磁场方向固定），可以用来不断校正陀螺仪的累积漂移。

### 1.3 磁力计——测地磁场方向

磁力计测量地球磁场在三个轴上的分量，用于修正偏航角（Yaw）的漂移。

```
地磁场 ≈ 0.5 高斯，从磁南极指向磁北极
在北半球，磁力线从地下斜向上射出（磁倾角约 45°~70°）
```

**为什么需要磁力计**：陀螺仪的积分误差会随时间累积，导致偏航角持续漂移。磁力计提供绝对的地磁参考方向，可以消除这种漂移。

### 1.4 六轴 vs 九轴

| 配置 | 传感器 | 能测量 | 局限性 |
|------|--------|--------|--------|
| **6 轴** | 加速度计 + 陀螺仪 | Roll, Pitch, Yaw（短时） | Yaw 随时间漂移 |
| **9 轴** | 加速度计 + 陀螺仪 + 磁力计 | Roll, Pitch, Yaw（长期稳定） | 磁力计易受电机磁场干扰 |

> **为什么需要 9 轴（加磁力计）而非 6 轴就够了？** 加速度计可以修正 Roll 和 Pitch 的漂移，但无法修正 Yaw：重力矢量始终指向下方，绕垂直轴的旋转不会改变重力在加速度计上的投影——换言之，加速度计对 Yaw 是"盲"的。陀螺仪的 Yaw 通道没有绝对参考，漂移无法被加速度计抑制。磁力计通过测量地磁场方向，为 Yaw 提供了唯一的绝对参考，使偏航角长期稳定。

---

## 2. BMI088——GSRL 使用的 IMU 芯片

### 2.1 芯片特性

BMI088 是 Bosch 的高性能 6 轴 IMU，专为无人机和机器人设计：

| 参数 | 加速度计 | 陀螺仪 |
|------|---------|--------|
| 量程 | ±3g / ±6g / ±12g / ±24g | ±125°/s ~ ±2000°/s |
| 分辨率 | 16-bit | 16-bit |
| 接口 | SPI（最高 10MHz） | SPI（最高 10MHz） |
| 特点 | 抗振动、低噪声 | 低漂移、抗振动 |
| 加速度计和陀螺仪是**两颗独立芯片** | 各有自己的 SPI 片选 |

> **为什么选择 BMI088 而非常见的 MPU6050？** BMI088 是 Bosch 专门为无人机和机器人场景设计的工业级 IMU，其振动抑制能力远超消费级芯片——在电机高速运转的强振动环境下仍能输出稳定数据。关键设计：加速度计和陀螺仪封装在同一模块但分属两块独立硅片，各自拥有独立的 SPI 接口和片选信号，可同时读取而无总线竞争，这在 1kHz 高频读取场景下至关重要。此外，BMI088 的噪声密度显著低于同级产品，姿态解算精度更高。
>

### 2.2 SPI 连接拓扑

<figure class="diagram">
  <img src="/assets/diagrams/auto/d085-bbeba8.svg" alt="STM32F407 / BMI088">
  <figcaption>图：STM32F407 / BMI088</figcaption>
</figure>


> **注意**：加速度计和陀螺仪的 MISO 引脚可以共用，因为它们通过不同的 CS 信号分时选通。只有被 CS 拉低的芯片才会驱动 MISO。

### 2.3 寄存器读写协议

BMI088 使用标准的 [SPI](./09-SPI通信原理.md) 寄存器读写协议（CPOL=0, CPHA=0）：

```
读寄存器（2 字节帧）:
  Master 发送: [0 | 1 (R) | A6..A0]  [dummy (0xFF)]
  Slave  返回: [dummy               ]  [寄存器的值]

写寄存器（2 字节帧）:
  Master 发送: [0 | 0 (W) | A6..A0]  [要写入的值]
  
bit7: 1=读, 0=写
```

对应 GSRL 中的实现（`dvc_imu.cpp`）：

```cpp
inline void BMI088::readSingleReg(const SPIConfig &spiConfig,
                                   uint8_t reg, uint8_t &rxData)
{
    uint8_t txData[2] = {static_cast<uint8_t>(reg | 0x80), 0xFF};
    uint8_t rxBuf[2];
    HAL_GPIO_WritePin(spiConfig.csGPIOGroup, spiConfig.csGPIOPin, GPIO_PIN_RESET);
    HAL_SPI_TransmitReceive(spiConfig.hspi, txData, rxBuf, 2, 100);
    HAL_GPIO_WritePin(spiConfig.csGPIOGroup, spiConfig.csGPIOPin, GPIO_PIN_SET);
    rxData = rxBuf[1];  // 第 2 字节是有效数据
}
```

---

## 3. 姿态解算原理

### 3.1 为什么需要姿态解算

加速度计可以算出 Roll 和 Pitch（基于重力方向），陀螺仪可以积分得到角度变化，磁力计可以给出偏航参考。但三者各有缺陷：

| 传感器 | 优点 | 缺点 |
|--------|------|------|
| 加速度计 | 长期稳定（重力方向不变） | 对振动敏感，运动时测量的是"比力"而非重力 |
| 陀螺仪 | 瞬时响应快，不受线性加速度影响 | 积分误差累积，长期漂移 |
| 磁力计 | 绝对方向参考 | 响应慢，极易受电机/铁磁材料干扰 |

**姿态解算的本质**：融合三者数据，取长补短——用陀螺仪的短期精度修正加速度计的振动噪声，用加速度计和磁力计的长期稳定性消除陀螺仪的积分漂移。

### 3.2 互补滤波 vs Mahony vs EKF

| 算法 | 原理 | 复杂度 | 精度 | GSRL 中 |
|------|------|--------|------|---------|
| **互补滤波** | 陀螺仪高通 + 加速度计低通 = 全频段 | 低 | 一般 | — |
| **Mahony** | 基于 PI 补偿器的显式互补滤波 | 中 | 较好 | `Mahony` 类 |
| **EKF** | 扩展卡尔曼滤波，最优状态估计 | 高 | 最好 | `QuaternionEKF` 类 |

[AHRS](./13-GSRL工程结构与运行机制.md)（姿态航向参考系统）在 GSRL 的 Algorithm 层中实现，为上层 Task 提供欧拉角和四元数输出。GSRL 中的姿态解算架构：

```cpp
// 抽象接口
class AHRS {
public:
    virtual void init() = 0;
    const Vector3f &update(const Vector3f &gyro,
                           const Vector3f &accel,
                           const Vector3f &magnet = Vector3f());
    const Vector3f &getEulerAngle() const;
    const fp32 *getQuaternion() const;
};

// Mahony 实现（PI 补偿器）
class Mahony : public AHRS { ... };

// 四元数扩展卡尔曼滤波（EKF）实现
class QuaternionEKF : public AHRS { ... };
```

### 3.3 四元数 vs 欧拉角

姿态可以用两种方式表示：

| 表示法 | 形式 | 优点 | 缺点 |
|--------|------|------|------|
| **欧拉角** | (Roll, Pitch, Yaw) | 直观，人类可读 | 万向节死锁（Gimbal Lock） |
| **四元数** | (q0, q1, q2, q3) | 无死锁，适合插值，计算高效 | 不直观 |

> **为什么姿态解算内部使用四元数而非欧拉角？** 欧拉角存在万向节死锁（Gimbal Lock）：当 Pitch 达到 ±90° 时，Roll 轴和 Yaw 轴重合，丢失一个旋转自由度——四旋翼做垂直翻转时就会遇到这个问题，导致姿态解算崩溃。而四元数在任何姿态下都是奇点自由的，不会死锁。此外，四元数乘法（姿态更新）只需 16 次乘法和 12 次加法，比 3×3 旋转矩阵乘法更高效，这对每毫秒都要做姿态更新的嵌入式系统意义重大。

GSRL 内部使用四元数进行姿态更新，对外提供欧拉角接口：

```cpp
// 姿态解算后自动转换
void AHRS::convertQuaternionToEulerAngle()
{
    // 四元数 → 欧拉角
    // Roll  = atan2(2*(q0*q1 + q2*q3), 1 - 2*(q1*q1 + q2*q2))
    // Pitch = asin(2*(q0*q2 - q3*q1))
    // Yaw   = atan2(2*(q0*q3 + q1*q2), 1 - 2*(q2*q2 + q3*q3))

    m_eulerAngle[0] = atan2f(2*(q0*q1 + q2*q3), 1-2*(q1*q1 + q2*q2));  // Roll
    m_eulerAngle[1] = asinf(2*(q0*q2 - q3*q1));                        // Pitch
    m_eulerAngle[2] = atan2f(2*(q0*q3 + q1*q2), 1-2*(q2*q2 + q3*q3));  // Yaw
}
```

---

## 4. GSRL 中的 IMU 数据流

### 4.1 完整流程

<figure class="diagram">
  <img src="/assets/diagrams/auto/d086-b7fa72.svg" alt="数据采集 (中断驱动)">
  <figcaption>图：数据采集 (中断驱动)</figcaption>
</figure>


### 4.2 中断驱动的读取时机

GSRL 中的 IMU 数据读取由 BMI088 的 INT1 引脚触发：

```c
// stm32f4xx_it.c 中的加速度计数据就绪中断
void EXTI4_IRQHandler(void)
{
    HAL_GPIO_EXTI_IRQHandler(INT1_ACCEL_Pin);
}

// 用户实现的 HAL 回调
void HAL_GPIO_EXTI_Callback(uint16_t GPIO_Pin)
{
    if (GPIO_Pin == INT1_ACCEL_Pin) {
        imu.readRawData();        // 读取原始数据
        imu.dataCalibration();    // 校准
        imu.solveAttitude();      // 姿态解算
    }
}
```

**关键设计决策**：BMI088 的加速度计 INT1 设为 2kHz 输出，陀螺仪 INT1 也是 2kHz。实际使用中可能不会每次都解算（计算量大），而是在任务中以固定频率（如 1kHz）读取 IMU 对象的最新姿态即可——因为姿态解算已经在[中断](./04-中断与NVIC.md)中完成。

### 4.3 BMI088 的初始化流程

GSRL 中 `BMI088::init()` 的完整初始化和自检流程：

<figure class="diagram">
  <img src="/assets/diagrams/auto/d087-4f08d4.svg" alt="BMI088::init()">
  <figcaption>图：BMI088::init()</figcaption>
</figure>


### 4.4 校准（Calibration）

校准信息在 `BMI088::CalibrationInfo` 结构体中定义：

```cpp
struct CalibrationInfo {
    Vector3f gyroOffset;          // 陀螺仪零飘补偿（静止时角速度不为零）
    Vector3f accelOffset;         // 加速度计零飘补偿
    Vector3f magnetOffset;        // 磁力计零飘补偿
    Matrix33f installSpinMatrix;  // 安装误差修正旋转矩阵
};
```

校准过程：

```
① 陀螺仪零飘校准：
   静止时采集 N 秒数据 → 取均值 → 作为 gyroOffset

② 加速度计零飘校准：
   多个姿态下采集数据 → 椭球拟合 → 得到 accelOffset

③ 安装误差修正：
   IMU 芯片可能未完美对齐机器人坐标轴
   installSpinMatrix = 绕各轴的微小旋转修正

④ 磁力计校准：
   绕 8 字旋转采集数据 → 椭球拟合 → 得到 magnetOffset
   （在 GSRL 中，磁力计校准可能在外部完成，烧录到 IST8310 配置中）
```

### 4.5 温度控制

> **为什么 IMU 需要温度控制？** MEMS 陀螺仪和加速度计的输出会随温度变化而产生显著漂移：10°C 的温差可能导致陀螺仪零偏漂移数度/秒，足以让姿态在几秒内完全错误。BMI088 内置温度传感器，GSRL 可以配合加热电阻和 PID 温控回路，将芯片维持在恒定温度（通常 45~55°C），从根本上消除温度对传感器输出的影响，保证全季节、全工况下姿态数据的稳定一致。

---

## 5. IMU 与 GSRL 代码结构的关系

### 5.1 在分层架构中的位置

<figure class="diagram">
  <img src="/assets/diagrams/auto/d088-1551e8.svg" alt="Task 层:">
  <figcaption>图：Task 层:</figcaption>
</figure>


### 5.2 依赖关系

<figure class="diagram">
  <img src="/assets/diagrams/auto/d089-6429b2.svg" alt="BMI088">
  <figcaption>图：BMI088</figcaption>
</figure>


---

## 6. 常见问题

| 问题 | 原因 | 排查方法 |
|------|------|---------|
| Roll/Pitch 抖动剧烈 | 加速度计受振动影响 | 降低加速度计低通滤波截止频率 |
| Yaw 持续漂移 | 陀螺仪零飘未校准 | 重新进行陀螺仪零飘标定 |
| 姿态解算发散 | 四元数未归一化或 EKF 发散 | 检查 AHRS 初始化是否正确，启用卡方检验 |
| Yaw 角不准 | 磁力计受电机磁场干扰 | 将磁力计远离电机安装，或使用硬/软铁校准 |
| 初始化后角度错误 | 初始四元数计算错误 | 确保 IMU 在初始化时保持静止 |
| SPI 读回全 0xFF 或全 0x00 | SPI 通信失败 | 检查 CS 引脚电平切换、SPI 模式和时钟配置 |
| 温度漂移大 | 陀螺仪/加速度计温漂 | 启用温度控制（BMI088 的恒温加热功能） |

---

## 7. 总结

| 要点 | 说明 |
|------|------|
| 加速度计 | 测量比力（重力 + 运动），静止时 = [0, 0, g] |
| 陀螺仪 | 测量角速度，积分得角度，但有漂移 |
| 磁力计 | 测量地磁场方向，修正 Yaw 漂移 |
| 姿态解算 | 融合三传感器数据，互补滤波或 EKF |
| 四元数 | 内部中间表示，无万向节死锁 |
| BMI088 | 双 SPI 接口（加速度计 + 陀螺仪），INT1 中断驱动读取 |
| 校准 | 零飘 + 安装误差 + 磁力计椭球拟合 |
| GSRL 架构 | IMU(Base) → BMI088(SPI) + AHRS(算法) + IST8310(磁力计) |

### 与 GSRL 的关系

`dvc_imu.hpp/cpp` 中的 `IMU` 基类和 `BMI088` 派生类是 GSRL 姿态感知的核心。它组合了 SPI 驱动（数据采集）、校准参数（零飘/安装误差修正）、AHRS 算法（姿态解算），向上提供简洁的 `getEulerAngle()` / `getGyro()` / `getAccel()` 接口。机器人底盘平衡、云台稳定、导航定位等所有上层控制都依赖于这一层提供的姿态信息。

> 下一篇：[GSRL 工程结构与运行机制](./13-GSRL工程结构与运行机制.md)

> **作者**: [Qing](https://github.com/ZhangChuqing) | **修改日期**: 2026-07-18
