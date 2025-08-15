# Python 装饰器详解

Python 装饰器是 Python 语言中一个强大而实用的特性，它允许我们在不修改原函数代码的情况下，为函数添加新的功能。

## 什么是装饰器？

装饰器本质上是一个函数，它接受一个函数作为参数，并返回一个新的函数。装饰器的语法使用 @ 符号。

## 基本装饰器示例

```python
def my_decorator(func):
    def wrapper():
        print("函数执行前的操作")
        func()
        print("函数执行后的操作")
    return wrapper

@my_decorator
def say_hello():
    print("Hello, World!")

say_hello()
```

## 带参数的装饰器

```python
def repeat(times):
    def decorator(func):
        def wrapper(*args, **kwargs):
            for _ in range(times):
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat(3)
def greet(name):
    print(f"Hello, {name}!")

greet("Alice")
```

## 总结

装饰器是 Python 中非常有用的特性，它可以让我们在不修改原函数的情况下扩展函数功能，实现关注点分离。