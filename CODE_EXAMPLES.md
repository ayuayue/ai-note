# 关键代码示例

## Header 示例

### Header 包含内容
- Logo (60x60px)
- 标题: AI 个人笔记
- 副标题: 记录 AI 协助的技术笔记
- 5个话题标签
- 工具和归档按钮
- 固定的主题切换和返回顶部按钮

## Feed（文章列表）示例

每个文章卡片包含：
- 标题链接
- 发布日期
- 分类标签
- 文章摘要（30字）
- 阅读更多链接

网格布局：repeat(auto-fill, minmax(650px, 1fr))
Hover效果：Y轴-5px，阴影加强

## 分页导航示例

第1页: 上一页 | 1(当前) | 2 | 3 | 4 | 下一页
第2页: 上一页 | 1 | 2(当前) | 3 | 4 | 下一页

路径处理：
- 第1页在根目录: index.html
- 其他页在子目录: pages/index2.html

## JavaScript 功能

### 暗色模式切换
- 读取 localStorage 的 theme-mode
- 在 html 元素上切换 dark-mode 类
- CSS 变量自动适配

### 返回顶部
- 滚动 > 300px 显示按钮
- 点击平滑滚动到顶部
