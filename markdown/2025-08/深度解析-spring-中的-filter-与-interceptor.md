

# 深度解析 Spring 中的 Filter 与 Interceptor

## 摘要

在基于 Spring/Spring Boot 的 Web 开发中，过滤器（Filter）和拦截器（Interceptor）是实现横切关注点（Cross-Cutting Concerns）如日志记录、权限校验、性能监控等功能的核心工具。尽管它们在功能上看似相似，但其底层原理、作用范围、执行时机和能力边界却有着本质的区别。本报告旨在深入剖析 Filter 和 Interceptor 的核心知识点，通过详细的对比和代码示例，帮助开发者理解它们的差异，并为在具体场景中做出正确的技术选型提供指导。

---

## 1. Filter (过滤器) - Servlet 的守护者

### 1.1 核心概念

Filter 是 **Java Servlet 规范** 的一部分（`javax.servlet.Filter`），它不是 Spring 框架特有的。它的核心职责是在 Servlet 容器级别，对进入的 HTTP 请求和返回的响应进行拦截和处理。

可以把 Filter 想象成是进入你整个 Web 应用（在 Spring Boot 中就是 `DispatcherServlet`）之前的第一道大门。



### 1.2 关键知识点

*   **来源**：源自 Servlet API，任何支持 Servlet 的 Web 容器（如 Tomcat, Jetty）都支持它。
*   **执行时机**：在 `DispatcherServlet` 接收到请求**之前**执行，在响应返回给客户端**之后**执行。它包裹着整个 Servlet 的处理流程。
*   **作用范围**：能够接触到最原始的 `HttpServletRequest` 和 `HttpServletResponse` 对象。因此，它可以修改请求的 Header、Body，甚至可以阻止请求到达 Servlet。
*   **生命周期**：由 Servlet 容器管理，随应用的启动而创建，随应用的关闭而销毁。主要方法是 `init()`, `doFilter()`, `destroy()`。
*   **依赖注入**：默认情况下，Filter 的实例由 Servlet 容器创建，它本身不在 Spring 的 IoC 容器中，因此**不能直接注入** Spring 管理的 Bean。但在 Spring Boot 中，通过 `@Component` 注解可以让 Filter 成为一个 Spring Bean，从而实现依赖注入。

### 1.3 Demo: 实现一个日志 Filter

#### 步骤 1: 创建 Filter 实现

```java
package com.example.demo.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import java.io.IOException;

@Component
@Order(1) // 使用 @Order 注解指定 Filter 的执行顺序，值越小，优先级越高
public class LoggingFilter implements Filter {

    private static final Logger logger = LoggerFactory.getLogger(LoggingFilter.class);

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        long startTime = System.currentTimeMillis();

        logger.info("请求进入 Filter - URI: {}, Method: {}", 
                     httpRequest.getRequestURI(), httpRequest.getMethod());

        // !!! 关键：调用 chain.doFilter() 将请求传递给下一个 Filter 或目标 Servlet
        chain.doFilter(request, response);

        long duration = System.currentTimeMillis() - startTime;
        logger.info("请求处理完毕 Filter - URI: {}, 耗时: {}ms", 
                     httpRequest.getRequestURI(), duration);
    }
    
    // 其他 init 和 destroy 方法可以根据需要实现
}
```

#### 步骤 2: 自动注册

在 Spring Boot 中，只需要给 Filter 的实现类加上 `@Component` 注解，它就会被自动扫描并注册到 Servlet 容器中。使用 `@Order` 可以控制多个 Filter 的执行顺序。

---

## 2. Interceptor (拦截器) - Spring MVC 的调度员

### 2.1 核心概念

Interceptor 是 **Spring MVC 框架** 提供的一种机制（`org.springframework.web.servlet.HandlerInterceptor`）。它专门用于在 `DispatcherServlet` 内部，对即将由 Controller 处理的请求进行更精细的控制。

可以把 Interceptor 想象成是进入 Controller 方法之前和之后的安检员和收尾员。



### 2.2 关键知识点

*   **来源**：源自 Spring MVC 框架，必须在 Spring Web 环境下使用。
*   **执行时机**：它工作在 `DispatcherServlet` 的处理流程中，围绕着 Controller 的方法执行。它提供了三个关键的切入点：
    1.  `preHandle()`: 在 Controller 方法**执行之前**调用。
    2.  `postHandle()`: 在 Controller 方法**执行之后**，但在视图（View）渲染**之前**调用。
    3.  `afterCompletion()`: 在整个请求处理完成（包括视图渲染）**之后**调用，主要用于资源清理。
*   **作用范围**：可以获取到即将执行的 `HandlerMethod`（即哪个 Controller 的哪个方法）、`ModelAndView` 对象。它无法修改请求的 Body，但可以影响 Controller 的执行（例如 `preHandle` 返回 `false` 来中断请求）。
*   **依赖注入**：Interceptor 本身就是一个 Spring Bean，由 Spring IoC 容器管理，因此可以**自由地注入**任何其他的 Bean（如 Service, Repository 等）。

### 2.3 Demo: 实现一个权限校验 Interceptor

#### 步骤 1: 创建 Interceptor 实现

```java
package com.example.demo.interceptor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(AuthInterceptor.class);

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        logger.info("Interceptor preHandle: 在 Controller 执行前");
        
        // 示例：检查请求头中是否有 'token'
        String token = request.getHeader("token");
        if (token == null || token.isEmpty()) {
            logger.warn("权限校验失败：缺少 token");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return false; // 返回 false，请求被中断，不会进入 Controller
        }
        
        // 校验通过
        return true; // 返回 true，继续执行后续的 Interceptor 和 Controller
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler,
                           ModelAndView modelAndView) throws Exception {
        logger.info("Interceptor postHandle: 在 Controller 执行后，视图渲染前");
        // 可以在这里修改 ModelAndView
        if (modelAndView != null) {
            modelAndView.addObject("interceptor_msg", "由 Interceptor 添加的数据");
        }
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex)
            throws Exception {
        logger.info("Interceptor afterCompletion: 在整个请求完成后");
        // 可以在这里进行资源清理，即使 Controller 抛出异常也会执行
        if (ex != null) {
            logger.error("请求处理中发生异常: ", ex);
        }
    }
}
```

#### 步骤 2: 注册 Interceptor

Interceptor 需要通过实现 `WebMvcConfigurer` 接口来手动注册，并指定要拦截的 URL 路径模式。

```java
package com.example.demo.config;

import com.example.demo.interceptor.AuthInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Autowired
    private AuthInterceptor authInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/api/**") // 指定要拦截的路径
                .excludePathPatterns("/api/login", "/api/public/**"); // 指定要排除的路径
    }
}
```

---

## 3. 深度对比：Filter vs. Interceptor

为了更清晰地理解它们的区别，我们用一个表格来总结：

| 特性 | Filter (过滤器) | Interceptor (拦截器) |
| :--- | :--- | :--- |
| **来源** | Servlet API (Java EE 标准) | Spring MVC 框架 |
| **依赖关系** | 独立于 Spring，可用于任何 Servlet 应用 | 强依赖于 Spring MVC |
| **执行时机** | 在 Servlet (`DispatcherServlet`) 之前和之后 | 在 `DispatcherServlet` 内部，Controller 方法之前、之后、完成时 |
| **控制粒度** | 粗粒度。基于 URL 模式进行拦截 | 细粒度。可以获取到具体的 HandlerMethod，进行更精细的控制 |
| **访问能力** | 可访问原始的 `HttpServletRequest` 和 `HttpServletResponse` | 可访问 `HandlerMethod`, `ModelAndView` 等 Spring MVC 核心对象 |
| **核心功能** | 修改 Request/Response、字符编码、数据压缩、跨域(CORS) | 权限校验、日志记录、性能监控、向 `Model` 添加通用数据 |
| **依赖注入** | 默认不支持，但在 Spring Boot 中可通过 `@Component` 实现 | 天然支持，本身就是 Spring Bean |
| **异常处理** | 无法直接捕获 Controller 层的异常 | `afterCompletion` 方法可以获取到 Controller 抛出的异常 |

### 执行流程图

下图清晰地展示了在一个请求处理周期中，Filter 和 Interceptor 的执行顺序：

```
客户端请求 --> [Filter 1] --> [Filter 2] --> DispatcherServlet --> [Interceptor 1 preHandle] --> [Interceptor 2 preHandle] --> Controller 方法 --> [Interceptor 2 postHandle] --> [Interceptor 1 postHandle] --> View 渲染 --> [Interceptor 2 afterCompletion] --> [Interceptor 1 afterCompletion] --> DispatcherServlet 响应 --> [Filter 2] --> [Filter 1] --> 客户端响应
```

这个流程形成了一个典型的“洋葱模型”：Filter 在最外层，Interceptor 在内层。

---

## 4. 总结与最佳实践

在技术选型时，可以遵循以下原则：

1.  **何时使用 Filter？**
    *   **全局性、与业务逻辑无关的操作**：当你需要处理所有进入应用的请求，并且这些操作不依赖于 Spring 的业务逻辑时，Filter 是最佳选择。
    *   **典型场景**：
        *   **字符编码（Character Encoding）**：Spring Boot 已自动处理，但手动配置时常用 Filter。
        *   **跨域资源共享（CORS）**：通过 `CorsFilter` 实现全局跨域配置。
        *   **数据压缩（GZIP）**。
        *   **自定义 XSS 防护**。

2.  **何时使用 Interceptor？**
    *   **与 Spring MVC 业务逻辑紧密相关的操作**：当你需要基于 Controller 的方法进行判断，或者需要使用 Spring 容器中的 Service 来进行逻辑处理时，应该使用 Interceptor。
    *   **典型场景**：
        *   **用户认证与权限校验**：判断用户是否登录，是否有权限访问某个 Controller 方法。
        *   **日志记录**：记录哪个用户调用了哪个 Controller 方法，传入了什么参数。
        *   **性能监控**：精确计算某个 Controller 方法的执行时间。
        *   **预处理通用数据**：向所有页面的 `ModelAndView` 中添加通用信息（如当前用户名、全局配置等）。

**核心思想**：让专业的人做专业的事。**Filter 负责“进门前”的粗加工，Interceptor 负责“房间内”的精细化服务。** 在现代 Spring Boot 应用中，我们更常使用 Interceptor 来处理业务相关的横切逻辑，而 Filter 则更多地用于处理更底层的、与框架无关的 Web 通用功能。