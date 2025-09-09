# 测试表格样式问题

<table class="styled-table">
<colgroup>
<col style="width: 15%">
<col style="width: 23%">
<col style="width: 28%">
<col style="width: 18%">
<col style="width: 13%">
</colgroup>
<thead>
<tr class="header">
<th>数据库系统</th>
<th>默认升序NULL位置</th>
<th>NULLS FIRST/LAST支持</th>
<th>索引存储NULL</th>
<th>替代语法</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>PostgreSQL</td>
<td>最后</td>
<td>完全支持</td>
<td>存储</td>
<td>无</td>
</tr>
<tr class="even">
<td>MySQL 8.0+</td>
<td>最前</td>
<td>完全支持</td>
<td>不存储</td>
<td>无</td>
</tr>
<tr class="odd">
<td>MySQL &lt;8.0</td>
<td>最前</td>
<td>不支持</td>
<td>不存储</td>
<td>IF/COALESCE</td>
</tr>
<tr class="even">
<td>Oracle</td>
<td>最后</td>
<td>完全支持</td>
<td>不存储</td>
<td>无</td>
</tr>
<tr class="odd">
<td>SQL Server</td>
<td>最前</td>
<td>完全支持</td>
<td>可配置</td>
<td>无</td>
</tr>
<tr class="even">
<td>SQLite</td>
<td>最前</td>
<td>不支持</td>
<td>不存储</td>
<td>CASE WHEN</td>
</tr>
</tbody>
</table>