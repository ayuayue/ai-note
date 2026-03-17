
## Java List 转数组最佳实践

在 Java 日常开发中，把 `List<T>` 转成数组几乎是“标配”操作：  
你可能写过 `list.toArray(new T[list.size()])`，也看过 `list.toArray(new T[0])`。  
它们都能得到正确结果，但为什么社区更推荐 `new T[0]`？当数组不够时，内部又是怎么“扩容”的？

这篇文章把答案讲清楚，并给出可直接落地的最佳实践。

### 结论先行（可直接记）

- **更推荐**：`list.toArray(new T[0])`
- **更现代**（若 JDK 支持该重载）：`list.toArray(T[]::new)`
- **何时不选 `new T[0]`**：你已经有一个可复用的数组缓存，且想避免重复分配

### `toArray(T[] a)` 的核心规则

`Collection.toArray(T[] a)` 的行为规则很明确：

1. 如果 `a.length < size`：**创建一个新数组**（长度为 `size`，运行时类型与 `a` 一致），并复制数据。
2. 如果 `a.length == size`：**直接复用 `a`**，把元素拷贝进去。
3. 如果 `a.length > size`：**复用 `a`**，拷贝元素后在 `a[size]` 位置写入 `null` 作为终止标记。

所以，`new T[0]` 的意义就是：**只告诉类型，大小由实现决定**。

### 为什么 `new T[0]` 更推荐

#### 1. 语义更清晰：只表达“类型”

`list.toArray(new T[0])` 的语义是：  
“我只关心最终数组的**运行时类型**，具体长度请按你实际 size 来。”

这比手动写 `list.size()` 更简洁，也避免了把“长度”这个细节暴露给调用方。

#### 2. 避免潜在的“双分配”

`new T[list.size()]` 会**先分配一个数组**。  
如果此时集合大小发生变化（并发修改或逻辑变动），`toArray` 仍可能再分配一次新数组。

`new T[0]` 则把分配权交给 `toArray`，**通常只分配一次**。

#### 3. 现代 JDK 下性能差异极小

在现代 JDK 中，`toArray(new T[0])` 的内部实现会直接创建目标大小的新数组并拷贝，  
与 `new T[list.size()]` 在性能上通常**相差无几**，而代码可读性明显更好。

> 如果你想极致优化，建议基于真实数据进行基准测试；  
> 否则优先选择更清晰、更少心智负担的写法。

### 了解“扩容”：数组不够时内部怎么做

以 `ArrayList` 的实现为例，`toArray(T[] a)` 大致逻辑如下：

```java
public <T> T[] toArray(T[] a) {
    int size = this.size;
    if (a.length < size) {
        // 创建一个运行时类型与 a 一致的新数组，长度为 size
        return (T[]) Arrays.copyOf(elementData, size, a.getClass());
    }
    System.arraycopy(elementData, 0, a, 0, size);
    if (a.length > size) {
        a[size] = null;
    }
    return a;
}
```

可以看到：

- 当 `a.length < size` 时，并不是“扩容原数组”，而是**直接创建一个新数组**。
- 新数组的**运行时类型**来自 `a.getClass()`，这就是为什么你必须传一个 `T[]`。
- 拷贝通过 `System.arraycopy` 或 `Arrays.copyOf` 完成，效率很高。

### 推荐写法

```java
List<String> list = Arrays.asList("A", "B", "C");

// 推荐：只声明类型
String[] arr1 = list.toArray(new String[0]);

// 若 JDK 支持该重载（更现代）
String[] arr2 = list.toArray(String[]::new);
```

### 什么时候用 `new T[list.size()]`？

**几乎不需要。**  
只有当你已经持有一个可复用的数组（例如缓存池），并且希望尽量复用它时，才有意义传一个非 0 长度数组。

否则，从可读性和工程实践角度看，`new T[0]` 是更稳妥、更现代的选择。

### 总结

`List.toArray(new T[0])` 的优势不在“绝对性能”，而在：

- 更清晰的语义表达
- 更少的心智负担
- 更少的潜在重复分配
- 与现代 JDK 实现更契合

因此它成为社区更推荐的写法。  
在无需极限微优化的日常项目里，**用它就对了**。
