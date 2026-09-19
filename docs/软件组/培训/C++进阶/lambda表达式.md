# Lambda 表达式

Lambda 表达式是 C++11 引入的匿名函数对象，让你可以在需要函数的地方就地定义一个短小的函数，避免为一次性逻辑额外写一个命名函数。

---

## 1. 概念——就地定义的小函数

### 1.1 没有 lambda 时怎么做

假设你需要对一个数组中的每个元素做平方操作。传统写法需要单独定义一个函数：

```cpp
// 传统做法：定义一个命名函数
int square(int x) {
    return x * x;
}

// 在另一处调用
std::transform(data.begin(), data.end(), data.begin(), square);
//                                                       ^^^^^^
//                                             函数名要跳转到别处才能看到实现
```

问题：`square` 的实现在别处，阅读代码时需要跳转。而且如果只在一个地方用一次，单独定义一个函数显得啰嗦。

### 1.2 lambda 的做法

```cpp
std::transform(data.begin(), data.end(), data.begin(),
    [](int x) { return x * x; }   // 就地定义，一眼看到实现
);
```

### 1.3 类比

- 传统函数 = 一篇独立的文章，有标题（函数名），读者需要翻目录查找
- Lambda = 正文中的脚注，就地解释，读完即走，不占用命名空间

**但本质上，lambda 仍然是一个函数——有参数、有返回值、有一段可执行的代码。它的特殊之处在于可以直接"捕获"周围作用域的变量。**

---

## 2. 语法拆解

<figure class="diagram">
  <img src="/assets/diagrams/auto/d012-a5d77a.svg" alt="捕获列表 / 参数列表 / 返回类型（可选） / 函数体">
  <figcaption>图：捕获列表 / 参数列表 / 返回类型（可选） / 函数体</figcaption>
</figure>


### 2.1 参数列表和返回值

与普通函数一致，`-> 返回类型` 在能推导时可以省略：

```cpp
auto add = [](int a, int b) { return a + b; };        // 返回 int，自动推导
auto div = [](int a, int b) -> float { return a / b; }; // 显式指定返回 float
```

### 2.2 捕获列表——lambda 的核心能力

捕获列表决定了 lambda 体内可以使用哪些外部变量，以及以何种方式访问：

```cpp
int x = 10;
int y = 20;
```

| 捕获方式 | 写法 | 含义 | lambda 内能否修改外部变量 |
|----------|------|------|---------------------------|
| 不捕获 | `[]` | 不使用任何外部变量 | — |
| 按值捕获全部 | `[=]` | 外部变量在 lambda 内有一份拷贝 | 否（改的是拷贝，不影响原变量） |
| 按引用捕获全部 | `[&]` | 外部变量在 lambda 内是引用 | 是 |
| 按值捕获指定变量 | `[x]` | 只有 x 被拷贝进来 | 否 |
| 按引用捕获指定变量 | `[&x]` | 只有 x 以引用方式进来 | 是 |
| 混合捕获 | `[=, &y]` | x 按值，y 按引用 | y 可以改 |
| 捕获 this | `[this]` | 在成员函数内使用当前对象的成员 | 可以改 `this` 指向的成员 |
| 捕获 this + 局部变量 | `[this, &x]` | 对象成员 + x 的引用 | 都可以改 |

```cpp
int x = 10;

auto byValue = [x]() { return x; };   // x 在这里被拷贝到 lambda 内部
x = 20;
byValue();  // 返回 10，不是 20——因为捕获发生在 lambda 定义时

auto byRef = [&x]() { return x; };    // 持有 x 的引用
x = 20;
byRef();    // 返回 20——读取的是 x 当前的值
```

<figure class="diagram">
  <img src="/assets/diagrams/auto/d013-282958.svg" alt="外部 int x=10 / lambda byValue">
  <figcaption>图：外部 int x=10 / lambda byValue</figcaption>
</figure>


---

## 3. 工程代码分析（GSRL 中的实际使用）

GSRL 中的 lambda 主要用于**行为树回调函数内部的辅助计算**——将一段只在某个状态机阶段使用的逻辑封装为局部函数，提升可读性。

### 3.1 离地检测：捕获 `this` 访问成员

**源码位置：** `Chariot/src/crt_chassis.cpp`，`Chassis::airborneController()`

```cpp
void Chassis::airborneController()
{
    // 定义一个 lambda 用于判断单条腿是否离地
    // [this] 捕获当前对象指针，lambda 内可以访问 m_imu 等成员
    auto airborneDection = [this](LegState &leg) {
        fp32 fn;
        fn = leg.virtualForce * arm_cos_f32(leg.theta)
           + leg.virtualTorque * arm_sin_f32(leg.theta) / leg.l0
           + (WHEEL_WEIGHT_KG * 9.8f);
        // ... 利用 m_imu 的加速度信息修正 fn ...

        fp32 airborneThreshold = (leg.l0 < AIRBORNE_LEG_LENGTH_BOUNDARY_M)
            ? AIRBORNE_DETECTION_THRESHOLD_SHORT_N
            : AIRBORNE_DETECTION_THRESHOLD_LONG_N;

        if (fn < airborneThreshold) {
            leg.isAirBorne = true;
        }
        // ...
    };

    // 对左右腿调用同一个 lambda
    airborneDection(m_leftLeg);
    airborneDection(m_rightLeg);
}
```

```bash
流程：
  airborneDection = [this](LegState &leg) { ... }
        │
        ├── 调用 airborneDection(m_leftLeg)  → 传入左腿引用，修改 m_leftLeg.isAirBorne
        └── 调用 airborneDection(m_rightLeg) → 传入右腿引用，修改 m_rightLeg.isAirBorne
```

**关键点：** `[this]` 捕获使得 lambda 内部可以直接访问 `m_imu`、`WHEEL_WEIGHT_KG` 等类成员，不需要通过参数传入。

### 3.2 姿态验证 + 退出跳跃：混合捕获

**源码位置：** `Chariot/src/crt_chassis_behavior.cpp`，`jumpStateMachineCallback()`

```cpp
BTStatus ChassisBehaviorTree::jumpStateMachineCallback(void *context)
{
    auto *self    = static_cast<ChassisBehaviorTree *>(context);
    auto *chassis = self->m_chassis;
    // ...

    // 捕获 chassis 指针（按值），判断起跳姿态是否满足条件
    auto isJumpPostureOK = [chassis]() -> bool {
        return fabsf(chassis->m_leftLeg.theta)  < JUMP_POSTURE_THETA_MAX_RAD &&
               fabsf(chassis->m_rightLeg.theta) < JUMP_POSTURE_THETA_MAX_RAD &&
               fabsf(chassis->m_eulerAngle.x)   < JUMP_POSTURE_TILT_MAX_RAD  &&
               fabsf(chassis->m_eulerAngle.y)   < JUMP_POSTURE_TILT_MAX_RAD;
    };

    // 同时捕获 self 和 chassis，退出跳跃时重置状态
    auto exitJump = [self, chassis](bool ignoreArm) {
        self->m_jumpPhase        = JUMP_PHASE_IDLE;
        self->m_jumpLaunchActive = false;
        if (ignoreArm) {
            self->m_jumpArmIgnored = true;
        }
        chassis->m_leftJumpLegLengthPID.pidClear();
        chassis->m_rightJumpLegLengthPID.pidClear();
    };

    // 限制移动速度
    auto clampChassisSpeed = [chassis]() {
        chassis->m_targetPosition -= chassis->m_targetSpeed * chassis->m_loopDeltaTime;
        chassis->m_targetSpeed = std::clamp(chassis->m_targetSpeed,
                                            -JUMP_MAX_SPEED_MPS, JUMP_MAX_SPEED_MPS);
        chassis->m_targetPosition += chassis->m_targetSpeed * chassis->m_loopDeltaTime;
    };

    // 在 switch-case 状态机中按需调用
    switch (self->m_jumpPhase) {
        case JUMP_PHASE_LAUNCH:
            if (!isJumpPostureOK()) {           // ✅ 就地调用，语义清晰
                exitJump(true);
            }
            break;
        // ...
    }
}
```

**为什么用 lambda 而不是普通函数：**
- 这些逻辑只在 `jumpStateMachineCallback` 这一个函数内使用
- 直接写 lambda 让读者在同一个屏幕内看到定义和调用，不需要跳转
- `[chassis]` 按值捕获一个指针（8 字节拷贝），成本极低，且语义上表明只用 `chassis` 这一个外部变量

### 3.3 限制角度领先量：按引用捕获参数

**源码位置：** `Chariot/src/crt_chassis_behavior.cpp`，`recoveryStateMachineCallback()`

```cpp
// 限制 phi0 目标相对实际角度的领先量
auto limitTargetPhi0Lead = [](fp32 &targetPhi0, const fp32 &actualPhi0) {
    fp32 targetLead = GSRLMath::normalizeDeltaAngle(targetPhi0 - actualPhi0);
    GSRLMath::constrain(targetLead, RECOVERY_PHI0_TARGET_LEAD_LIMIT);
    targetPhi0 = GSRLMath::normalizeDeltaAngle(actualPhi0 + targetLead);
};
```

这个 lambda 不捕获任何外部变量（`[]`），所有数据通过参数传入。`targetPhi0` 是非 const 引用，lambda 内可以修改调用者传入的变量。

---

## 4. 动手写：在 GSRL 场景中使用 lambda

### 4.1 配合 STL 算法

```cpp
#include <algorithm>
#include <array>

// 场景：检查所有电机电流是否在安全范围内
std::array<float, 4> motorCurrents = {2.5f, 3.1f, 1.8f, 12.0f};
const float MAX_CURRENT = 10.0f;

// 用 lambda 配合 std::any_of 检查是否有超标电机
bool hasOvercurrent = std::any_of(
    motorCurrents.begin(), motorCurrents.end(),
    [MAX_CURRENT](float current) { return current > MAX_CURRENT; }
);
// hasOvercurrent == true（第 4 个电机 12.0 > 10.0）
```

### 4.2 行为树条件节点的就地逻辑

```cpp
// 传统写法：条件逻辑散落在回调函数中
BTStatus myCondition(void *context) {
    auto *chassis = static_cast<Chassis *>(context);
    if (chassis->m_eulerAngle.x > 30.0f || chassis->m_eulerAngle.y > 30.0f) {
        return BT_FAIL;
    }
    return BT_SUCCESS;
}

// lambda 写法：在 setCondition 处就地定义，逻辑与注册在同一位置
myNode.setCondition(
    [](void *ctx) -> bool {
        auto *chassis = static_cast<Chassis *>(ctx);
        return fabsf(chassis->m_eulerAngle.x) < 30.0f &&
               fabsf(chassis->m_eulerAngle.y) < 30.0f;
    }
);
```

### 4.3 常见错误

```cpp
void badExample()
{
    int counter = 0;

    // 错误1：按值捕获后修改副本，外部不受影响
    auto badIncrement = [counter]() { counter++; };  // ❌ 编译错误
    // counter 是按值捕获的副本，默认不可修改（lambda 的 operator() 是 const）
    // 即使加 mutable，改的也是副本，外部 counter 不变

    // 正确：如果确实需要修改外部变量，用引用捕获
    auto goodIncrement = [&counter]() { counter++; }; // ✅

    // 错误2：lambda 存活时间超过捕获的引用
    std::function<void()> storedLambda;
    {
        int localVar = 42;
        storedLambda = [&localVar]() { return localVar; };
    }  // localVar 在此销毁
    // storedLambda();  // ❌ 悬垂引用！localVar 已经不存在了

    // 正确：如果 lambda 需要存活到作用域之外，按值捕获或确保引用有效
}
```

### 4.4 mutable——允许修改按值捕获的副本

```cpp
int x = 10;

// 默认情况下，按值捕获的变量在 lambda 内是 const
// auto f = [x]() { x++; };  // ❌ 编译错误

// 加 mutable 关键字后可以修改副本（外部原变量不受影响）
auto f = [x]() mutable { x++; return x; };
f();  // 返回 11
f();  // 返回 12——副本在每次调用间保持状态
// 外部 x 仍然是 10
```

---

## 5. 本质——lambda 到底是什么

```cpp
auto add = [](int a, int b) { return a + b; };
```

编译器实际上将 lambda 翻译成一个匿名类：

```cpp
// 编译器生成的等价代码（简化版）
class __lambda_add {
public:
    int operator()(int a, int b) const {
        return a + b;
    }
};
__lambda_add add;  // add 实际上是一个对象，不是一个函数指针
```

- **lambda 是一个对象**（functor），不是函数指针
- `operator()` 被调用时执行 lambda 体内的代码
- 捕获列表中的变量成为这个匿名类的成员变量
- 每个 lambda 有独一无二的类型，用 `auto` 接收最方便

```cpp
// 如果捕获了变量：
int x = 10;
auto f = [x](int a) { return a + x; };

// 编译器大致生成：
class __lambda_f {
    int __x;  // 捕获的变量变成成员
public:
    __lambda_f(int x) : __x(x) {}
    int operator()(int a) const { return a + __x; }
};
```

---

## 6. 什么时候用 lambda vs 普通函数

| 场景 | 推荐方式 | 原因 |
|------|----------|------|
| 只用一次的辅助逻辑 | lambda | 就地定义，不需要命名和跳转 |
| 多处复用的通用逻辑 | 普通函数 | lambda 重复定义浪费代码，普通函数可复用 |
| 传给 STL 算法的谓词 | lambda | 简洁，捕获外部变量方便 |
| 行为树节点回调 | 普通函数（当前 GSRL 做法） | 函数指针稳定，类型已知，注册简单 |
| 回调内部的状态机辅助 | lambda | 只在该回调内部使用，封装性好 |
| 异步/线程任务 | lambda | 可以方便地捕获上下文数据 |

---

## 7. 总结

| 概念 | 说明 |
|------|------|
| 本质 | 匿名函数对象（functor），有独一无二的类类型 |
| 核心能力 | 捕获外部变量（按值/按引用），在函数体内使用 |
| `[=]` | 按值捕获全部外部变量，lambda 内不可修改副本（除非加 `mutable`） |
| `[&]` | 按引用捕获全部外部变量，lambda 内可修改原变量 |
| `[this]` | 在成员函数中捕获当前对象，可直接使用成员变量和成员函数 |
| `[x, &y]` | 混合捕获：x 按值，y 按引用 |
| `-> 返回类型` | 可省略，编译器通常能自动推导 |
| GSRL 中的典型用法 | 行为树回调内部的辅助函数（离地检测、姿态验证、速度限制） |

---

## 8. 与 GSRL 的关系

在 GSRL 中，行为树节点的回调通过**函数指针**注册（参考 `培训/using别名.md` 的行为树部分），这是历史设计选择——函数指针类型固定，注册简单，且不引入模板开销。

但在回调函数**内部**，lambda 被广泛用于封装局部辅助逻辑：

- `airborneController()` 中 `[this]` 捕获的离地检测 lambda
- 跳跃状态机中 `[chassis]` 捕获的姿态验证 lambda
- 自起状态机中 `[]` 不捕获的角度限制 lambda

这种"外层用函数指针注册，内层用 lambda 组织逻辑"的模式，兼顾了接口的简洁性和内部实现的可读性。

> **作者**: [Qing](https://github.com/ZhangChuqing) | **修改日期**: 2026-07-18
