# Lecture 1 小作业：使用 STM32CubeMX 新建工程

本文是 [从零开始电控开发 —— Lecture 1](./Lecture1.md) 的配套实操教程，以 STM32F103C8T6 开发板为例，介绍 STM32CubeMX 安装、工程配置、代码生成与交叉编译。

## 1. 软件安装

### 1.1. 安装 STM32CubeMX 软件

从飞书群下后双击安装包“SetupSTM32CubeMX-6.18.1-Win-x86_64.zip”，具体操作步骤如下：

先打开文件。在安全警告选择“打开”

![STM32CubeMX 工程创建操作截图 1](./images/stm32cubemx-new-project/01.png)

![STM32CubeMX 工程创建操作截图 2](./images/stm32cubemx-new-project/02.png)

使用文件资源管理器打开zip文件，然后运行安装程序。在这一步选择第一项。之后就按照下面的图示操作。

![STM32CubeMX 工程创建操作截图 3](./images/stm32cubemx-new-project/03.png)

![STM32CubeMX 工程创建操作截图 4](./images/stm32cubemx-new-project/04.png)

![STM32CubeMX 工程创建操作截图 5](./images/stm32cubemx-new-project/05.png)

![STM32CubeMX 工程创建操作截图 6](./images/stm32cubemx-new-project/06.png)

![STM32CubeMX 工程创建操作截图 7](./images/stm32cubemx-new-project/07.png)

![STM32CubeMX 工程创建操作截图 8](./images/stm32cubemx-new-project/08.png)

![STM32CubeMX 工程创建操作截图 9](./images/stm32cubemx-new-project/09.png)

![STM32CubeMX 工程创建操作截图 10](./images/stm32cubemx-new-project/10.png)

![STM32CubeMX 工程创建操作截图 11](./images/stm32cubemx-new-project/11.png)

安装完成后，可以开始新建工程了。如果打不开，需要先安装java环境。

## 2. 新建工程

打开STM32CubeMX，软件会更新一些组件，等待安装完成即可。

![STM32CubeMX 工程创建操作截图 12](./images/stm32cubemx-new-project/12.png)

### 2.1. 选择 CPU 型号

这个根据你开发板使用的CPU具体的型号来选择，在这里我们选择培训使用的STM32F103C8T6。

![STM32CubeMX 工程创建操作截图 13](./images/stm32cubemx-new-project/13.png)

![STM32CubeMX 工程创建操作截图 14](./images/stm32cubemx-new-project/14.png)

![STM32CubeMX 工程创建操作截图 15](./images/stm32cubemx-new-project/15.png)

![STM32CubeMX 工程创建操作截图 16](./images/stm32cubemx-new-project/16.png)

![STM32CubeMX 工程创建操作截图 17](./images/stm32cubemx-new-project/17.png)

### 2.2. 确认时钟源

进入工程后打开RCC选项，选择Crystal/Ceramic Resonator，即使用外部晶振作为HSE（High Speed External)的时钟源。

![STM32CubeMX 工程创建操作截图 20](./images/stm32cubemx-new-project/20.png)

![STM32CubeMX 工程创建操作截图 21](./images/stm32cubemx-new-project/21.png)

### 2.3. 配置 IO 口

这个工程简单控制一个LED周期闪烁，我们只需要配置一个IO即可，大家可以根据自己的开发板情况来配置，这里选定控制板载红色LED的引脚PC13，通过搜索框搜索可以定位IO口的引脚位置，图中会闪烁显示，配置PC13的属性为GPIO_Output。

![STM32CubeMX 工程创建操作截图 22](./images/stm32cubemx-new-project/22.png)

### 2.4. 配置系统时钟

![STM32CubeMX 工程创建操作截图 23](./images/stm32cubemx-new-project/23.png)

### 2.5. 进一步配置 IO 的具体属性

点击Configuration，进入系统详细配置，选择GPIO，配置PC13的默认电平，开漏输出，无上下拉，低速模式。引脚标签为LED_R。

参考资料：[GPIO输入输出模式原理(八种工作方式附电路图详解)_gpio四种输入输出模式-CSDN博客](https://blog.csdn.net/zhuguanlin121/article/details/118489092)

![STM32CubeMX 工程创建操作截图 24](./images/stm32cubemx-new-project/24.png)

![STM32CubeMX 工程创建操作截图 25](./images/stm32cubemx-new-project/25.png)

![STM32CubeMX 工程创建操作截图 26](./images/stm32cubemx-new-project/26.png)

### 2.6. 配置工程属性

为了防止出现，烧录以后仿真器无法连接的情况，我们一定要在Pinout里将SYS里面的Debug设置成Serial Wire,这样问题得到解决。

![STM32CubeMX 工程创建操作截图 18](./images/stm32cubemx-new-project/18.png)

![STM32CubeMX 工程创建操作截图 19](./images/stm32cubemx-new-project/19.png)

接着选择Project Manager选项，配置工程的名称，路径，堆栈大小（保持默认即可），toolchain/IDE 选择cmake。注意不要使用中文路径和工程名称。

![STM32CubeMX 工程创建操作截图 28](./images/stm32cubemx-new-project/28.png)

### 2.7. 生成代码

点击GENERATE CODE,在设定的路径成功生成代码

![STM32CubeMX 工程创建操作截图 29](./images/stm32cubemx-new-project/29.png)

![STM32CubeMX 工程创建操作截图 30](./images/stm32cubemx-new-project/30.png)

![STM32CubeMX 工程创建操作截图 31](./images/stm32cubemx-new-project/31.png)

![STM32CubeMX 工程创建操作截图 32](./images/stm32cubemx-new-project/32.png)

![STM32CubeMX 工程创建操作截图 33](./images/stm32cubemx-new-project/33.png)

![STM32CubeMX 工程创建操作截图 34](./images/stm32cubemx-new-project/34.png)

接着使用VSCODE打开工程（可以打开对应文件夹，然后右键选择“用vscode打开”，如果没有此选项，则可以选择“用终端打开”，然后在终端输入 `code .` 来打开当前文件夹（注意有“[空格] 和 .”）。

![STM32CubeMX 工程创建操作截图 35](./images/stm32cubemx-new-project/35.png)

### 2.8. 配置下载调试工具

首先确保自己已经安装了gcc-arm-toolchain（下载链接：<https://gitlab.arm.com/api/v4/projects/tooling%2Fgnu-toolchains-for-arm/packages/generic/gnu-toolchain/15.3.rel1/arm-gnu-toolchain-15.3.rel1-mingw-w64-x86_64-arm-none-eabi.msi>）。

![STM32CubeMX 工程创建操作截图 37](./images/stm32cubemx-new-project/37.png)

双击运行

![STM32CubeMX 工程创建操作截图 38](./images/stm32cubemx-new-project/38.png)

运行并安装，msi安装程序会自动配置环境变量。

安装完成后，还需要安装cmake 和 ninja 构建工具。如果您使用Windows，推荐使用winget进行安装：

按win+R 打开“运行”窗口，输入“powershell”。

![STM32CubeMX 工程创建操作截图 39](./images/stm32cubemx-new-project/39.png)

在终端分别输入以下命令来安装cmake与ninja：

```powershell
winget install cmake
winget install Ninja-build.Ninja
```

注意，由于下载源位于境外，您可能需要设置代理来获得较快的下载速度。

![STM32CubeMX 工程创建操作截图 40](./images/stm32cubemx-new-project/40.png)

![STM32CubeMX 工程创建操作截图 41](./images/stm32cubemx-new-project/41.png)

## 3. 交叉编译

确保cmake ninja 和 gcc-arm toolchain 都安装完成之后可以开始交叉编译。注意，对于windows用户，可能需要重启vscode进程树（把所有窗口都关了重开）来刷新环境变量。

![STM32CubeMX 工程创建操作截图 42](./images/stm32cubemx-new-project/42.png)

![STM32CubeMX 工程创建操作截图 43](./images/stm32cubemx-new-project/43.png)

出现内存分布情况就是成功了。将生成.elf可执行文件。

![STM32CubeMX 工程创建操作截图 44](./images/stm32cubemx-new-project/44.png)

成功生成elf文件就是成功。
