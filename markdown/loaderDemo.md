# Java 动态编译与加载深度报告

Java 动态编译与加载深度报告
            从 .java 源码到运行时实例的全过程揭秘

一、核心原理：JVM 不认识 .java
                
                    JVM：一个只懂字节码的“施工队”
                    Java 虚拟机 (JVM) 的设计目标是成为一个高效的、跨平台的**字节码执行引擎**。它并不关心这些字节码最初是用 Java、Kotlin 还是 Scala 写的。
                    因此，任何 .java 源代码都必须先通过编译器 (javac) 这个“翻译官”，转换成 JVM 能看懂的 .class 文件（字节码）。这个过程是**强制性**的。
                
            
            
            
                二、解决方案：在运行时扮演“翻译官”
                既然编译是必须的，那么我们可以在程序运行时，调用 Java 开发工具包 (JDK) 中内置的编译器 API，来动态完成这个编译过程。这个强大的工具就是 javax.tools.JavaCompiler。
                
                实现流程：
                
                    **准备源代码：** 将 .java 文件的内容作为字符串或从文件中读取。
                    调用编译器 API：** 在内存中将源代码字符串编译成字节码 (byte[])。
                    创建自定义类加载器：** 这个加载器可以直接从内存中的字节码数组加载类。
                    加载并使用：** 使用自定义加载器加载这个新编译的类，并通过反射创建实例和调用方法。
                
            

            
                三、实战 Demo：动态编译并执行代码
                下面的 Demo 将一个包含 .java 源代码的字符串，在运行时编译、加载，并执行其中的方法。这个例子是完全自包含的，可以直接复制运行。
                
                
                    运行环境要求：此代码必须在 **JDK (Java Development Kit)**环境下运行，而不是 JRE (Java Runtime Environment)，因为它需要调用 JDK 内置的编译器工具。
                

                import javax.tools.*;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.lang.reflect.Method;
import java.net.URI;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public class DynamicCompilerAndLoader {

    public static void main(String[] args) throws Exception {
        
        // --- 1. 准备要动态编译的 .java 源代码 ---
        String sourceCode = "package com.example.dynamic;" +
                            "public class DynamicGreeter {" +
                            "    public void greet() {" +
                            "        System.out.println(\"Hello from a dynamically compiled and loaded class!\");" +
                            "    }" +
                            "}";

        String className = "com.example.dynamic.DynamicGreeter";

        // --- 2. 动态编译源代码 ---
        System.out.println("--> Step 1: Compiling source code in memory...");
        Map<String, byte[]> compiledBytecodes = compile(className, sourceCode);
        byte[] greeterBytecode = compiledBytecodes.get(className);
        System.out.println("--> Compilation successful!");

        // --- 3. 使用自定义类加载器加载字节码 ---
        System.out.println("\n--> Step 2: Loading bytecode with MemoryClassLoader...");
        MemoryClassLoader classLoader = new MemoryClassLoader(compiledBytecodes);
        Class<?> dynamicGreeterClass = classLoader.loadClass(className);
        System.out.println("--> Class loaded successfully: " + dynamicGreeterClass.getName());
        System.out.println("--> Loaded by: " + dynamicGreeterClass.getClassLoader());


        // --- 4. 通过反射创建实例并调用方法 ---
        System.out.println("\n--> Step 3: Creating instance and invoking method via reflection...");
        Object instance = dynamicGreeterClass.getDeclaredConstructor().newInstance();
        Method method = dynamicGreeterClass.getMethod("greet");
        method.invoke(instance);
    }
    
    /**
     * 内存中的字节码类加载器
     */
    static class MemoryClassLoader extends ClassLoader {
        private final Map<String, byte[]> classBytes;

        public MemoryClassLoader(Map<String, byte[]> classBytes) {
            // 使用 AppClassLoader 作为父加载器
            super(DynamicCompilerAndLoader.class.getClassLoader());
            this.classBytes = classBytes != null ? classBytes : Collections.emptyMap();
        }

        @Override
        protected Class<?> findClass(String name) throws ClassNotFoundException {
            byte[] buf = classBytes.get(name);
            if (buf != null) {
                // 关键步骤：将字节码数组定义为 Class 对象
                return defineClass(name, buf, 0, buf.length);
            }
            return super.findClass(name); // 遵循双亲委派
        }
    }

    /**
     * 动态编译方法
     */
    public static Map<String, byte[]> compile(String className, String sourceCode) {
        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) {
            throw new IllegalStateException("Cannot find the system Java compiler. " +
                    "Please run this code with a JDK, not a JRE.");
        }

        // 用于接收编译后的字节码
        final Map<String, ByteArrayOutputStream> outputStreamMap = new HashMap<>();

        JavaFileManager fileManager = new ForwardingJavaFileManager<JavaFileManager>(
                compiler.getStandardFileManager(null, null, null)) {
            @Override
            public JavaFileObject getJavaFileForOutput(Location location, String className,
                                                       JavaFileObject.Kind kind, FileObject sibling) {
                ByteArrayOutputStream bos = new ByteArrayOutputStream();
                outputStreamMap.put(className, bos);
                return new SimpleJavaFileObject(URI.create(""), kind) {
                    @Override
                    public OutputStream openOutputStream() {
                        return bos;
                    }
                };
            }
        };

        JavaFileObject sourceFile = new SimpleJavaFileObject(URI.create(""), JavaFileObject.Kind.SOURCE) {
            @Override
            public CharSequence getCharContent(boolean ignoreEncodingErrors) {
                return sourceCode;
            }
            @Override
            public String getName() {
                return className.replace('.', '/') + Kind.SOURCE.extension;
            }
        };

        JavaCompiler.CompilationTask task = compiler.getTask(null, fileManager, null, null,
                null, Collections.singletonList(sourceFile));

        boolean success = task.call();
        if (!success) {
            throw new RuntimeException("Compilation failed!");
        }

        Map<String, byte[]> result = new HashMap<>();
        outputStreamMap.forEach((name, bos) -> result.put(name, bos.toByteArray()));
        return result;
    }
}

            

            
                四、专家级分析
                
                    为什么必须用反射？
                    在 `main` 方法中，我们加载了 `DynamicGreeter` 类，但我们不能像这样直接使用它：
                    // 下面这行代码无法通过编译！
DynamicGreeter greeter = new DynamicGreeter();
                    这是因为 `DynamicCompilerAndLoader` 这个类本身是由 AppClassLoader 加载的。在**编译** `DynamicCompilerAndLoader.java` 时，编译器（`javac`）在它的 classpath 中根本找不到一个叫 `DynamicGreeter` 的类，所以会直接报错“找不到符号”。
                    `DynamicGreeter` 这个类只在**运行时**才存在，并且存在于我们的 `MemoryClassLoader` 中。AppClassLoader 对它一无所知。因此，我们必须使用**反射 (Reflection)** 这种“在运行时查找和调用”的机制来与这个动态加载的类进行交互。
                
                
                 
                    总结：从源码到运行的完整路径
                    这个 Demo 完整地展示了 Java 动态性的强大之处：
                    
                        源代码 (String) -> Java 是一种静态类型语言，但其源代码可以动态生成或获取。
                        -> `JavaCompiler` API -> 这是连接源码和字节码的桥梁，是实现动态性的关键。
                        -> 字节码 (byte[]) -> 这是 JVM 的“母语”，是所有类加载的基础。
                        -> `CustomClassLoader` -> 这是将字节码注入到运行中 JVM 的“注射器”。
                        -> `Class` 对象 -> 字节码被加载后在 JVM 中的体现，是所有操作的入口。
                        -> `Reflection` -> 这是在编译时类型未知的情况下，与动态加载的 `Class` 对象进行交互的唯一手段。
                    
                    理解了这个流程，就掌握了 Java 中许多高级框架（如热部署、AOP、规则引擎）的底层实现原理。

Java 动态编译与加载深度报告 © 2025

