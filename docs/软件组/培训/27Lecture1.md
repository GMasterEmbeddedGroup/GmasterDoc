# 开学第一课 —— 电控组

面向新队员的第一次课，回答三个问题：**电控组做什么**、**我装的每个工具有什么用**、**怎么跑通第一个工程**。

本页内嵌的是可交互课件：课件里的步骤条、折叠问答、工程目录树都能点开查看细节，也可以用键盘翻页；课件中所有技术名词都带了可点击的超链接，方便当场查资料。

---

## 课件

<div style="border:1px solid var(--md-default-fg-color--lightest);border-radius:8px;overflow:hidden;background:#fff">
  <iframe
    src="../slides/first-lesson/index.html"
    title="开学第一课 —— 电控组（交互式课件）"
    style="display:block;width:100%;aspect-ratio:16/10;border:0"
    allowfullscreen
    loading="lazy"
    onclick="this.contentWindow.focus()"></iframe>
</div>

<a href="../slides/first-lesson/index.html" target="_blank" rel="noopener">全屏打开课件</a>

> **操作提示**：先点击课件区域（让键盘焦点进入课件），再用 <kbd>←</kbd> <kbd>→</kbd> / <kbd>空格</kbd> 翻页；<kbd>Esc</kbd> 打开总览；<kbd>F</kbd> 全屏。若键盘没有反应，直接点右下角的翻页箭头即可。

---

## 课件大纲

| 章节 | 内容 |
| --- | --- |
| 1. 电控导论 —— 电控组需要做什么？ | **1.1 以一台步兵机器人为例**：演示视频；一台车由三块 STM32 分工——云台（pitch/yaw 与摩擦轮电机 PID、CAN 总线、遥控器接收机、状态机与行为树）、串联腿底盘（串联腿 LQR、轮电机力矩控制、MPC 功率控制）、路由 C 板（统筹 CAN 总线、上下位机与裁判系统通信）。**1.2 培养计划与学习路线图**：技术栈表（语言 / 平台 / 通信 / 算法 / 工具）；分阶段培养方案——通识 C/C++，之后操作系统组与算法组分轨（HAL、时钟树、中断、GPIO、CAN、SPI/IIC、FreeRTOS、ROS、PID 与调参、控制理论、卡尔曼滤波） |
| 2. 开发平台与工作流介绍 | 2.1 工具链：每个工具只管一段路（VS Code / CubeMX / arm-none-eabi-gcc / CMake / OpenOCD / ST-Link / CubeProgrammer / Git 逐个详解）；2.2 编译原理与全流程；2.3 操作系统、裸机与交叉编译 |
| 3. VS Code 与 STM32CubeMX 的安装 | 3.1 安装 VS Code 与插件；3.2 安装 STM32CubeMX 与固件包；3.3 常见问题与环境自检清单 |
| 4. 拓展：创建你的第一个工程 | 4.1 新建工程与生成设置；4.2 工程结构与 CMake；4.3 编译与烧录 |

其中 **4.2 工程结构与 CMake** 覆盖了 CubeMX 生成工程中的 `.ioc`、`Core/`、`Drivers/`、启动文件、链接脚本、`CMakeLists.txt`、`CMakePresets.json`、`build/` 等文件的作用。

课件中的配图取自 [Wikimedia Commons](https://commons.wikimedia.org/)（CC0 / CC BY / CC BY-SA 等）与战队官网，逐张的出处与许可见 `slides/first-lesson/img/SOURCES.txt`。

---

## 配套资源

- **STM32CubeMX 下载**：[官网页面](https://www.st.com/en/development-tools/stm32cubemx.html) ｜ [课件中使用的 6.12.1 安装包直链](https://www.st.com/content/ccc/resource/technical/software/sw_development_suite/group1/2a/7f/09/90/25/59/44/10/stm32cubemx-win-v6-12-1/files/SetupSTM32CubeMX-6.12.1-Win.zip/jcr:content/translations/en.SetupSTM32CubeMX-6.12.1-Win.zip)
- **装工具链**：[Lesson1 开发环境配置](Lesson1%20开发环境配置.md)
- **学基础**：[嵌入式基础](嵌入式基础/index.md)、[C++ 基础](C++基础/index.md)
- **学协作**：[Git 工作流](../../文档站指南/git工作流.md)

---

## 课后作业

**成功交叉编译一次。**

1. 确认工具链已装好：命令行输入 `arm-none-eabi-gcc --version`，能输出版本号；
2. 用 CubeMX 生成一个空工程（STM32F407 或 H7），工具链选 **CMake**；
3. 在工程目录下构建，直到 `build/` 下产出 `.elf` 文件——这一步走通，就说明你写的 C++ 已经被翻译成 STM32 能执行的机器码；
4. 用 `arm-none-eabi-size <你的工程名>.elf` 看一眼它占了多大；
5. 把第 1 步和第 4 步的命令行输出截图发到群里。

> **作者**: [Metalxiaoxiao](https://github.com/Metalxiaoxiao) | **修改日期**: 2026-09-16
