#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import re
from datetime import datetime

def extract_title_from_html(file_path):
    """Extract the title from an HTML file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            # Look for <title> tag
            title_match = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE)
            if title_match:
                return title_match.group(1)
            
            # If no title tag, look for first h1
            h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', content, re.IGNORECASE)
            if h1_match:
                return h1_match.group(1)
                
            # If no title or h1, use filename
            return os.path.splitext(os.path.basename(file_path))[0]
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return os.path.splitext(os.path.basename(file_path))[0]

def generate_doc_card(filename, title):
    """Generate a document card HTML snippet"""
    # Simple preview text - in a real implementation, you might extract this from the file
    previews = {
        "jvm-desc.html": "深入探讨JVM中所有类型的描述符，包括基础类型、对象类型、数组类型以及方法描述符，并提供详尽的示例。",
        "classloader.html": "从 JVM 启动到自定义实现的全景透视，详细解析类加载器的工作原理和双亲委派机制。",
        "springboot-start.html": "详细分析 Spring Boot/Cloud 应用的启动流程，包括上下文层级结构和环境属性源的优先级。",
        "report.html": "关于 JVM 类加载和执行子系统的详细技术报告。",
        "myclassloader.html": "自定义类加载器的实现方式和应用场景分析。",
        "loaderDemo.html": "类加载器工作原理的演示和实例分析。",
        "maven-report.html": "Maven 项目的依赖分析和技术报告。",
        "t6-manage-spring.context.html": "Spring 应用上下文的管理和配置分析。",
        "java.net.preferIPv4Stack.html": "Java 网络协议栈配置参数详解。"
    }
    
    preview = previews.get(filename, "技术文档内容")
    
    return f'''            <div class="doc-card">
                <a href="html/{filename}" class="doc-link">
                    <h2 class="doc-title">{title}</h2>
                    <p class="doc-preview">{preview}</p>
                    <span class="doc-file">{filename}</span>
                </a>
            </div>'''

def main():
    # Get all HTML files in the html directory
    html_dir = "html"
    if not os.path.exists(html_dir):
        print(f"Directory {html_dir} does not exist")
        return
    
    html_files = [f for f in os.listdir(html_dir) if f.endswith('.html')]
    
    if not html_files:
        print("No HTML files found in the html directory")
        return
    
    # Generate doc cards
    doc_cards = []
    for filename in sorted(html_files):
        file_path = os.path.join(html_dir, filename)
        title = extract_title_from_html(file_path)
        doc_cards.append(generate_doc_card(filename, title))
    
    # Read template
    try:
        with open("template.html", "r", encoding="utf-8") as f:
            template = f.read()
    except FileNotFoundError:
        print("template.html not found")
        return
    
    # Replace placeholder with doc cards
    doc_cards_html = "\n".join(doc_cards)
    updated_content = template.replace("{{DOC_CARDS}}", doc_cards_html)
    
    # Write to index.html
    with open("index.html", "w", encoding="utf-8") as f:
        f.write(updated_content)
    
    print(f"Generated index.html with {len(doc_cards)} documents")
    print("Files included:")
    for filename in sorted(html_files):
        print(f"  - {filename}")

if __name__ == "__main__":
    main()