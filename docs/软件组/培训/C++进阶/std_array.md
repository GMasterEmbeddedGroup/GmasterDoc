# std::array

`std::array<T, N>` 是 C++11 引入的固定大小数组容器，它把 C 风格数组的安全性（边界检查、`size()` 方法）与零额外开销的静态分配结合在一起。

---

## 1. 概念——它解决什么问题

### 1.1 C 风格数组的四个痛点

```cpp
// 方式 A：C 风格数组
float motorPositions[4] = {0.0f, 0.0f, 0.0f, 0.0f};
```

| 痛点 | 具体表现 |
|------|----------|
| **不知道自己的大小** | `sizeof(arr) / sizeof(arr[0])` 容易写错，传给函数后退化为指针后完全失效 |
| **不能直接赋值** | `arr2 = arr1;` 编译失败，只能用 `memcpy` |
| **不能按值传递/返回** | 函数参数中退化为指针，丢失大小信息 |
| **没有边界检查** | `arr[10]` 越过数组末尾，静默地破坏相邻内存 |

### 1.2 std::array 的解决方案

```cpp
#include <array>

// 方式 B：std::array
std::array<float, 4> motorPositions = {0.0f, 0.0f, 0.0f, 0.0f};
```

<figure class="diagram">
  <img src="/assets/diagrams/auto/d014-f7830e.svg" alt="C 风格数组 / std::array">
  <figcaption>图：C 风格数组 / std::array</figcaption>
</figure>


**关键理解：`std::array` 是零开销抽象（zero-overhead abstraction）——它的内存布局与 C 风格数组完全一致，所有的大小信息和成员函数都在编译期处理，不产生任何运行时开销。**

---

## 2. 基本用法

### 2.1 声明与初始化

```cpp
#include <array>

// 三种初始化方式
std::array<int, 3> a1 = {1, 2, 3};      // 列表初始化（C++11）
std::array<int, 3> a2{1, 2, 3};         // 直接列表初始化
std::array<int, 3> a3;                  // 默认初始化（元素值不确定，与 C 数组行为一致）
a3.fill(0);                             // 全部填 0
```

### 2.2 常用操作

| 操作 | 代码 | 说明 |
|------|------|------|
| 获取大小 | `arr.size()` | 返回 `N`，编译期常量 |
| 访问元素 | `arr[i]` | 不检查边界（与 C 数组行为一致） |
| 带检查的访问 | `arr.at(i)` | 越界时抛出 `std::out_of_range` |
| 首元素 | `arr.front()` | 等价于 `arr[0]` |
| 末元素 | `arr.back()` | 等价于 `arr[N-1]` |
| 获取原始指针 | `arr.data()` | 返回 `T*`，传给需要 C 数组的 API |
| 全部填充 | `arr.fill(value)` | 所有元素设为 `value` |
| 判空 | `arr.empty()` | 始终返回 `false`（`N > 0` 时）或 `true`（`N == 0` 时），编译期确定 |
| 赋值 | `arr2 = arr1;` | ✅ 支持！逐元素拷贝 |
| 比较 | `arr1 == arr2` | ✅ 支持！逐元素比较 |

### 2.3 遍历

```cpp
std::array<float, 4> currents = {2.5f, 3.1f, 1.8f, 4.2f};

// 方式 A：基于范围的 for 循环（推荐）
for (float c : currents) {
    // 处理 c
}

// 方式 B：传统下标
for (size_t i = 0; i < currents.size(); i++) {
    currents[i] *= 1.1f;
}

// 方式 C：迭代器
for (auto it = currents.begin(); it != currents.end(); ++it) {
    *it *= 1.1f;
}
```

---

## 3. 工程代码分析（GSRL 中的实际使用）

### 3.1 KalmanFilter：编译期维度的传感器映射

**源码位置：** `GSRL/Algorithm/inc/alg_filter.hpp`

`KalmanFilter` 是一个模板类，其观测维度 `MeasSize` 在编译期确定。`std::array` 的大小依赖模板参数，恰好匹配这种"编译期已知大小、运行时不变"的场景：

```cpp
template <typename T, int StateSize, int MeasSize, int ControlSize>
class KalmanFilter : public Filter<T>
{
    // ...
    // 测量与状态的映射关系，大小由模板参数 MeasSize 决定
    std::array<int, MeasSize> m_measurementMap;   // 如 {1, 1, 4}
    std::array<T, MeasSize>   m_measurementDegree; // 如 {1.0f, 1.0f, 1.0f}
    std::array<T, MeasSize>   m_rDiagonalElements; // 如 {0.5f, 0.3f, 0.1f}
};
```

```bash
当 MeasSize = 3 时，这三个 array 的内存布局：

  m_measurementMap:     [1] [1] [4]          ← 3 个 int，12 字节
  m_measurementDegree:  [1.0][1.0][1.0]      ← 3 个 T，12 字节（T=float）
  m_rDiagonalElements:  [0.5][0.3][0.1]      ← 3 个 T，12 字节

全部在 KalmanFilter 对象内部，不涉及堆分配。
```

**为什么用 `std::array` 而不是 `std::vector`：**
- 观测维度 `MeasSize` 是模板参数，编译期即确定——不需要 `vector` 的动态扩容能力
- `std::array` 的存储完全内嵌在 `KalmanFilter` 对象中，避免堆分配，符合嵌入式环境对实时性的要求
- `std::array` 的类型携带大小信息，编译器可以更好地优化（如循环展开）

### 3.2 配置传感器参数的接口

```cpp
// alg_filter.hpp 中的接口
void setDynamicAdjustmentParams(
    const std::array<int, MeasSize> &measurementMap,
    const std::array<T, MeasSize>   &measurementDegree,
    const std::array<T, MeasSize>   &rDiagonalElements
);
```

通过 `const &` 传入，避免拷贝整个数组（但这里数组本身很小，按值传递也可以接受）。`std::array` 作为函数参数不会退化为指针，调用者传入的数组大小必须在编译期与 `MeasSize` 匹配，否则编译失败——这提供了 C 风格数组不具备的类型安全。

---

## 4. 动手写：在 GSRL 场景中使用 std::array

### 4.1 电机电流监控

```cpp
#include <array>
#include <algorithm>

class MotorMonitor
{
public:
    static constexpr size_t MOTOR_COUNT = 4;
    static constexpr float  MAX_CURRENT = 10.0f;

    // 存储 4 个电机的电流读数
    std::array<float, MOTOR_COUNT> currents;

    MotorMonitor() {
        currents.fill(0.0f);
    }

    // 检查是否有电机电流超标
    bool hasOvercurrent() const {
        return std::any_of(
            currents.begin(), currents.end(),
            [](float c) { return c > MAX_CURRENT; }
        );
    }

    // 获取最大电流值
    float maxCurrent() const {
        return *std::max_element(currents.begin(), currents.end());
    }

    // 重置全部读数
    void reset() {
        currents.fill(0.0f);
    }
};
```

### 4.2 PID 参数管理

```cpp
#include <array>

// 管理一组 PID 的参数——内环 + 外环共 2 组，每组 3 个参数
class PIDManager
{
public:
    struct PIDParams {
        float Kp, Ki, Kd;
    };

    static constexpr size_t PID_COUNT = 2;

    // 用 std::array 存储固定数量的 PID 参数组
    std::array<PIDParams, PID_COUNT> params;

    PIDManager() {
        // 全部初始化为零
        params.fill({0.0f, 0.0f, 0.0f});
    }

    // 批量设置参数
    void setParams(const std::array<PIDParams, PID_COUNT> &newParams) {
        params = newParams;  // ✅ 直接赋值，逐元素拷贝
    }
};
```

### 4.3 常见错误

```cpp
// 错误1：初始化元素个数不匹配
std::array<int, 3> arr1 = {1, 2};         // 第三个元素是 0（值初始化）
std::array<int, 3> arr2 = {1, 2, 3, 4};  // ❌ 编译错误：太多了

// 错误2：尝试用变量指定大小
int n = 10;
// std::array<int, n> arr;  // ❌ 编译错误：N 必须是编译期常量

// 正确：用 constexpr 或字面量
constexpr int N = 10;
std::array<int, N> arr3;                  // ✅
std::array<int, 10> arr4;                 // ✅

// 错误3：与 vector 混淆
std::array<int, 5> arr5;
arr5.push_back(42);                       // ❌ 编译错误：array 没有 push_back
// array 大小固定，不能动态添加元素

// 错误4：忘记 array 的元素默认不初始化（与 C 数组一致）
std::array<int, 5> arr6;                  // 元素值不确定！
arr6.fill(0);                             // 如果手写 for 循环也比直接假设全零安全
```

---

## 5. std::array vs C 数组 vs std::vector

| 特性 | `T[N]`（C 数组） | `std::array<T, N>` | `std::vector<T>` |
|------|-----------------|--------------------|--------------------|
| 大小 | 编译期固定 | 编译期固定 | 运行时可变 |
| 存储位置 | 栈 / 静态存储区（取决于声明位置） | 栈 / 静态存储区 | 堆（内部数据） |
| `.size()` | ❌ | ✅（返回 N） | ✅（返回当前元素数） |
| 赋值 `a = b` | ❌ | ✅ | ✅ |
| 按值传递 | ❌（退化为指针） | ✅ | ✅ |
| 传给 C API | 直接传数组名 | `arr.data()` | `vec.data()` |
| 边界检查 | ❌ | `.at()` 有检查 | `.at()` 有检查 |
| 额外内存开销 | 无 | 无 | 3 个指针（约 24 字节） |

---

## 6. 本质——为什么 std::array 是零开销

```cpp
std::array<int, 4> arr = {1, 2, 3, 4};
```

编译器看到的内部结构（简化版）：

```cpp
template <typename T, size_t N>
struct array {
    T _M_elems[N];  // 唯一的数据成员——就是一个 C 风格数组

    // 以下全是 inline 函数，编译期展开后消失：
    constexpr size_t size()     const { return N; }
    constexpr bool   empty()    const { return N == 0; }
    T& operator[](size_t i)           { return _M_elems[i]; }
    T* data()                         { return _M_elems; }
    // ...
};
```

- `_M_elems` 是唯一的数据成员，所有方法都是 `inline` 且在编译期求值
- `sizeof(std::array<T, N>) == sizeof(T) * N`——与 C 数组占用完全相同的空间
- `arr.size()` 在编译期被替换为字面量 `N`，不产生任何指令

---

## 7. 总结

| 要点 | 说明 |
|------|------|
| 是什么 | 编译期定长数组的零开销包装，内存布局与 C 数组完全一致 |
| 解决什么 | C 数组不能赋值、不知道大小、传参退化为指针——这三个痛点 |
| 什么时候用 | 数组大小在编译期已知、运行时不变 |
| 什么时候不用 | 数组大小需要在运行时确定 → 用 `std::vector` |
| 性能 | 与 C 数组完全相同，无额外内存或运行时开销 |
| 与模板的关系 | `N` 是模板参数，天然适合依赖模板参数的编译器维度数组（如 `KalmanFilter` 的 `MeasSize`） |

---

## 8. 与 GSRL 的关系

在 GSRL 的嵌入式环境中，`std::array` 的静态分配特性与项目对实时性和内存可预测性的要求高度契合：

- `KalmanFilter` 用 `std::array` 存储与观测维度相关的映射数组——大小由模板参数决定，数据内嵌在滤波器对象中，不触发堆分配
- 电机控制、传感器滤波等场景中，数据维度通常在编译期确定（如 4 个电机、3 轴 IMU），`std::array` 是优于 `std::vector` 的选择
- `std::array` 配合 STL 算法（`std::any_of`、`std::max_element` 等），可以减少手写循环，提升代码可读性
- 与 C API 交互时，通过 `.data()` 获取原始指针，兼容性无损失

> **作者**: [Qing](https://github.com/ZhangChuqing) | **修改日期**: 2026-07-18
