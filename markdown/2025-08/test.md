# 测试文档

这是一个测试文档，用于验证 Markdown 到 HTML 的转换功能。

## 功能特性

- 支持标题转换
- 支持列表
- 支持代码块
- 支持表格
- 支持引用

## 代码示例

```java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```

## 表格示例

| 功能 | 状态 |
|------|------|
| 标题转换 | ✅ |
| 列表转换 | ✅ |
| 代码块 | ✅ |
| 表格 | ✅ |

> 这是一个引用块，用于显示重要信息。

更新时间: 2025年8月15日

## mermaid 示例

```mermaid
classDiagram
    direction TB

    %% JVM 内存整体结构
    class JVM {
        <<Java虚拟机内存模型>>
    }

    %% 线程私有区
    class ThreadPrivateArea {
        <<线程私有内存>>
        +程序计数器(PC Register): 当前指令地址
        +虚拟机栈(VM Stack): 方法调用栈帧
        +本地方法栈(Native Stack): JNI方法调用
    }

    %% 线程共享区
    class ThreadSharedArea {
        <<线程共享内存>>
        +堆(Heap): 对象实例存储
        +方法区(Method Area): 类元数据/静态变量
    }

    %% 堆内存细分
    class Heap {
        +年轻代(Young Generation)
        +老年代(Old Generation)
    }

    class YoungGeneration {
        +Eden区: 新对象分配
        +Survivor0(S0): MinorGC存活对象
        +Survivor1(S1): MinorGC存活对象
    }

    class OldGeneration {
        +长期存活对象
    }

    %% 方法区细分（JDK8+）
    class MethodArea {
        +元空间(Metaspace): 类元数据
        +运行时常量池: 字面量/符号引用
    }

    %% 关系定义
    JVM --> ThreadPrivateArea : 包含
    JVM --> ThreadSharedArea : 包含
    ThreadSharedArea --> Heap : 主存储区
    ThreadSharedArea --> MethodArea : 类/常量存储
    Heap --> YoungGeneration : 新生代
    Heap --> OldGeneration : 老年代
    YoungGeneration --> Eden区
    YoungGeneration --> Survivor0
    YoungGeneration --> Survivor1
```