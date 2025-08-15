# JVM内部类型描述符深度报告


## 1. 什么是类型描述符？

类型描述符是JVM在字节码层面用于表示Java类型的内部名称。它与我们在Java源代码中使用的类型名称不同，例如，java.lang.String 在JVM中的描述符为 Ljava/lang/String;。这种描述方式是JVM规范的一部分，确保了跨平台的统一性。

描述符主要分为两类：字段描述符（Field Descriptors）和方法描述符（Method Descriptors）。字段描述符用于表示一个类、实例或局部变量的类型，而方法描述符则用来描述一个方法的参数类型和返回值类型。


## 2. 字段描述符 (Field Descriptors)

字段描述符用于表示各种数据类型。


### 2.1 基础数据类型 (Primitive Types)

对于Java中的基础数据类型以及void类型，JVM都使用一个大写字母来表示，这种设计极大地压缩了字节码文件的体积。


| Java 类型 | 描述符 | 含义 |
| --- | --- | --- |
| byte | B | 有符号字节 |
| char | C | Unicode 字符 |
| double | D | 双精度浮点数 |
| float | F | 单精度浮点数 |
| int | I | 整型 |
| long | J | 长整型 |
| short | S | 有符号短整型 |
| boolean | Z | 布尔值 (在JVM中通常映射为int) |
| void | V | 表示方法无返回值 |


### 2.2 对象类型 (Object Types)

对象类型（或称为引用类型）的描述符以大写字母 L 开始，后面跟着类的全限定名（将包名中的 . 替换为 /），并以分号 ; 结束。这种格式可以明确地标识出引用类型的开始和结束，避免与其他描述符混淆。


| Java 类型 | 描述符 |
| --- | --- |
| java.lang.Object | Ljava/lang/Object; |
| java.lang.String | Ljava/lang/String; |
| java.lang.Thread | Ljava/lang/Thread; |
| com.example.MyClass | Lcom/example/MyClass; |


### 2.3 数组类型 (Array Types)

数组类型的描述符由一个或多个左方括号 [ 和其元素类型的描述符构成。方括号的数量代表了数组的维度。


| Java 类型 | 描述符 |
| --- | --- |
| int[] | [I |
| double[] | [D |
| java.lang.String[] | [Ljava/lang/String; |
| long[][] | [[J |
| com.example.MyClass[][][] | [[[Lcom/example/MyClass; |


## 3. 方法描述符 (Method Descriptors)

方法描述符用于完整地描述一个方法的参数列表和返回值。其格式为：(参数列表描述符)返回值描述符。

- 参数列表：位于圆括号 () 内，由零个或多个字段描述符按顺序拼接而成。
- 返回值：位于圆括号之后，是一个字段描述符。如果方法无返回值（即 void），则使用 V。


### 示例


| Java 方法声明 | 方法描述符 |
| --- | --- |
| void run() | ()V |
| String toString() | ()Ljava/lang/String; |
| int getAge() | ()I |
| void setValues(int a, float b) | (IF)V |
| long calculate(int[] ids, String name) | ([ILjava/lang/String;)J |
| Object m(int i, double d, Thread t) | (IDLjava/lang/Thread;)Ljava/lang/Object; |


## 4. 总结与应用

理解JVM类型描述符对于深入分析字节码文件、使用ASM等字节码操作框架以及进行底层的JVM故障排查都至关重要。例如，当我们使用 javap -s 或 javap -verbose 命令查看一个类的字节码时，就会看到这些描述符。它们是连接Java源代码和JVM执行层面的桥梁，是理解JVM内部工作机制的基石。

