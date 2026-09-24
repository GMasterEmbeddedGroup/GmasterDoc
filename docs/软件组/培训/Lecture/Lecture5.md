# CMake 与 Git 的使用 —— Lecture 5

面向第一次接触工程构建与版本控制的新队员。60 页自学型课件从一个只有 `main.c` 的 PC 项目开始，逐步拆出静态库，再把同样的 CMake 思路映射到 CubeMX、STM32 与 GSRL；随后使用 Git 完成检查、提交、分支、同步、冲突处理和 Pull Request。每个关键操作都给出原因、命令、结果和常见错误，仅阅读课件即可完成配套练习。

---

## 课件

<div style="border:1px solid var(--md-default-fg-color--lightest);border-radius:8px;overflow:hidden;background:#fff">
  <iframe src="../slides/lecture5/index.html" title="CMake 与 Git 的使用 —— Lecture 5（交互式课件）" style="display:block;width:100%;aspect-ratio:16/10;border:0" allowfullscreen loading="lazy" onclick="this.contentWindow.focus()"></iframe>
</div>

<a href="../slides/lecture5/index.html" target="_blank" rel="noopener">全屏打开课件</a>

> **操作提示**：点击课件后使用 <kbd>←</kbd> <kbd>→</kbd> 或 <kbd>空格</kbd> 翻页，<kbd>Esc</kbd> 打开总览，<kbd>F</kbd> 全屏。随堂小测、步骤页和检查清单可以直接点击。

## 课前环境

先把示例复制到不含中文和空格的工作目录，例如 `D:/workspace/lecture5-demo/`。在 Git Bash 或 VS Code 终端确认 `cmake --version`、`git --version`、`gcc --version` 和 `ninja --version` 能正常输出。若没有 Ninja，可以使用系统已有的 Make 或 Visual Studio 生成器。STM32 实操还需要 `arm-none-eabi-gcc`。

## 课程大纲

| 章节 | 内容 |
| --- | --- |
| 1. CMake 基础 | 构建链路、最小工程、常用语句、目标与作用域、静态库、多目录、生成器、构建类型、Preset、工具链文件与 CubeMX 映射 |
| 2. Git 基础与协作 | 工作区与暂存区、提交、历史、忽略规则、安全撤销、分支、合并、冲突、远程同步、Fork + PR、子模块及进阶命令的安全边界 |
| 3. 综合工作流 | 从功能需求开始，完成 CMake 构建验证、Git 分支提交、推送与 PR 自检 |

## 配套示例

示例位于 [`examples/lecture5-cmake-git-demo/`](examples/lecture5-cmake-git-demo/README.md)：

- `starter/`：可直接构建的单文件 C11 工程；
- `solution/`：包含静态库、公开头文件、子目录 CMake、Preset 和 `.gitignore` 的完整答案。

## 参考资料

- [CMake 官方教程](https://cmake.org/cmake/help/latest/guide/tutorial/index.html)
- [Git 官方参考](https://git-scm.com/docs)
- [GitHub：使用 Fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks)
- [GMaster Git 工作流](../../../文档站指南/git工作流.md)

---

> **作者**: [Metalxiaoxiao](https://github.com/Metalxiaoxiao) | **修改日期**: 2026-09-24
