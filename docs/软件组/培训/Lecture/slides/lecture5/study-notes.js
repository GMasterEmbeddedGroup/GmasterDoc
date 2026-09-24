(function () {
  'use strict';
  var notes = {
    '05-build-chain.html': '同一份 CMakeLists.txt 可以生成 Ninja、Make 或 Visual Studio 工程。它描述的是“要得到哪些目标以及目标依赖什么”，并不把某一种构建工具写死。',
    '06-source-build-tree.html': '源码树保存人工维护的输入，构建树保存能够重新生成的中间文件和产物。清理构建只需删除明确的 build 目录，不会误伤源码。',
    '07-starter-tree.html': '示例刻意只保留 main.c。先验证编译器和 CMake 链路，再增加库与目录，可以避免同时面对多种错误。',
    '08-minimal-cmakelists.html': 'CMake 从上到下解释文件。三条语句依次确定兼容规则、启用 C 编译器、创建可执行目标；前一步失败，后续就无法正常生成。',
    '10-add-executable.html': '目标名由项目定义，后续命令必须使用同一个名字。源文件路径相对于当前 CMakeLists.txt，生成程序位于构建目录。',
    '11-configure-build-run.html': '配置错误属于工程描述或工具链问题，构建错误属于编译或链接问题，运行错误才属于程序行为。先分清阶段，排错范围会小很多。',
    '12-cache-fresh.html': 'CMakeCache.txt 记录编译器路径、选项和检测结果。更换编译器后复用旧缓存，会让新旧工具链信息混在一起。',
    '13-variables-lists.html': '变量替换发生在 CMake 解释阶段，不是 C 程序运行阶段。变量名拼错常展开为空，因此关键路径可用 message 主动打印。',
    '14-message-if-option.html': 'option 的默认值写在工程里，用户用 -DNAME=ON 覆盖。条件成立后再把宏挂到目标，C 代码才能通过 #ifdef 看到它。',
    '15-target-sources.html': '将源码挂到明确目标后，IDE、增量构建和依赖分析都知道它属于谁。PRIVATE 表示这份实现不传播给依赖者。',
    '16-add-library.html': '静态库先把模块编译为可复用产物，最终链接进应用。calc 的接口放在 calc.h，实现放在 calc.c，调用者只依赖接口。',
    '17-link-library.html': '编译阶段解决“源文件能否变成目标文件”，链接阶段解决“函数实现在哪里”。undefined reference 常表示声明可见，但实现没有进入链接。',
    '18-include-scope.html': '头文件搜索路径不是复制头文件。它只是告诉编译器遇到 #include "calc.h" 时去哪些目录寻找。',
    '21-generators.html': '生成器只改变底层构建工具，不应改变项目功能。团队固定生成器可以减少命令、缓存和输出目录差异。',
    '22-build-types.html': 'Debug 便于断点和查看变量，Release 更关注执行效率。两者都应构建通过，不能用 Release 隐藏警告或未定义行为。',
    '25-cubemx-map.html': 'STM32 多了启动文件、链接脚本和 CPU 参数，但它们仍挂在目标上。理解目标模型后，CubeMX 文件就不再是陌生目录。',
    '29-version-control.html': 'Git 保存提交之间的关系和完整历史。频繁、边界清楚的提交能让评审者理解改动，也让回退范围更准确。',
    '30-four-zones.html': 'status 确认文件位于哪个区域，diff 确认具体内容。每次 add 和 commit 前都检查，可避免混入临时文件或无关修改。',
    '32-init-clone.html': 'init 只创建本地仓库；clone 还会下载历史、检出默认分支并配置 origin。已有团队项目应从 clone 开始。',
    '33-status-diff.html': 'git diff 比较工作区与暂存区，git diff --staged 比较暂存区与最近提交。两者都看，才能知道下一次提交包含什么。',
    '34-stage.html': '暂存不是备份，而是提交清单。同一工作区可以同时存在准备提交的修改和仍在继续编辑的修改。',
    '35-commit.html': '提交包含父提交、作者、时间、说明和文件快照。说明应描述结果，让读者无需打开差异也能判断用途。',
    '36-log-show.html': 'log 展示提交关系，show 展示一个提交的元数据和差异。排查回归时先用 log 找范围，再用 show 阅读变化。',
    '37-gitignore.html': '忽略规则只影响未跟踪文件。秘密即使后来删除也可能留在历史中，因此应在第一次 add 前排除。',
    '38-safe-undo.html': '撤销前先判断改动是否已经提交、提交是否已经共享。共享历史优先用 revert，新建反向提交比重写历史更安全。',
    '40-merge.html': 'merge 只组合提交图和文件内容。即使没有文本冲突，功能也可能产生逻辑冲突，所以合并后仍要重新构建和测试。',
    '42-remotes.html': 'origin 和 upstream 只是本地远程别名。运行 remote -v 核对 URL，可以防止把分支推到错误仓库。',
    '43-sync.html': 'fetch 只更新远程跟踪引用，便于先比较；pull 会立即整合到当前分支。重要分支优先 fetch、检查、再明确 merge。',
    '45-submodules.html': '父仓库记录子模块提交哈希，因此同伴能取得相同依赖版本。只更新子模块目录却不提交父仓库指针，团队看不到变化。'
  };
  function enrich(root, files) {
    var sections = Array.prototype.slice.call(root.querySelectorAll(':scope > section'));
    sections.forEach(function (section, index) {
      var value = notes[files[index]];
      if (!value || section.querySelector('.study-note')) { return; }
      var box = document.createElement('div');
      box.className = 'study-note';
      box.innerHTML = '<b>进一步理解</b>' + value;
      section.appendChild(box);
    });
  }
  window.Lecture5Study = { enrich: enrich };
})();
