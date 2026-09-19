# MkDocs 介绍与配置

## 1. 什么是 MkDocs

MkDocs 是一个静态站点生成器，能将 Markdown 文件编译为 HTML 网页。我们使用 **MkDocs Material** 主题，它提供了美观的界面和丰富的功能（搜索、代码高亮、导航折叠等）。

- 官网：[https://squidfunk.github.io/mkdocs-material/](https://squidfunk.github.io/mkdocs-material/)
- 仓库：[https://github.com/GMasterEmbeddedGroup/GmasterDoc](https://github.com/GMasterEmbeddedGroup/GmasterDoc)

## 2. 文件结构

<figure class="diagram">
  <img src="/assets/diagrams/auto/d001-7261e0.svg" alt="GmasterDoc">
  <figcaption>图：GmasterDoc</figcaption>
</figure>


## 3. 如何新增页面

### 3.1 创建 Markdown 文件

在你所属组的文件夹下创建 `.md` 文件。例如，硬件组新增一个焊接指南：

```
docs/硬件组/焊接指南.md
```

### 3.2 注册到导航

编辑根目录的 `mkdocs.yml`，在 `nav` 下对应位置添加条目：

```yaml
nav:
  - 硬件组:
      - 硬件组首页: 硬件组/index.md
      - 焊接指南: 硬件组/焊接指南.md    ← 新增这行
```

路径相对于 `docs/` 目录，使用 `/` 分隔，不要用 `\`。

## 4. 本地预览

```bash
# 安装依赖（首次）
pip install mkdocs-material

# 启动本地预览（文件修改后自动刷新）
mkdocs serve

# 仅构建（生成 site/ 目录）
mkdocs build
```

启动后在浏览器打开 `http://127.0.0.1:8000` 即可预览。

## 5. 注意事项

- 导航中用 `/` 分隔路径，不要用 `\`
- 链接其他 `.md` 文件时，使用相对路径并指向具体文件（如 `./C++基础/index.md` 而非 `./C++基础/`）
- PDF、图片等资源放在与引用它的 `.md` 文件相同的目录下
- 不要修改 `site/` 目录，它是构建产物
