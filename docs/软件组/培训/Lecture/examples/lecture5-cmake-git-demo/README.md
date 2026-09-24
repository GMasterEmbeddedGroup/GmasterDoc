# Lecture 5 配套示例

> Windows 实操请先把示例复制到不含中文和空格的工作目录，例如 `D:/workspace/lecture5-demo/`。部分工具版本处理含中文的 Preset 路径时会失败。

- `starter/`：只有 `main.c` 和最小 `CMakeLists.txt`，用于第一次配置与构建。
- `solution/`：将计算功能拆成静态库，并使用子目录、目标作用域和 CMake Preset。

在对应目录中运行：

```bash
cmake -S . -B build -G Ninja
cmake --build build
```

`solution/` 也可以运行：

```bash
cmake --preset debug
cmake --build build/debug
./build/debug/calc_demo.exe
```

Windows 使用非 Ninja 的多配置生成器时，可执行文件位置可能包含 `Debug/` 子目录。
