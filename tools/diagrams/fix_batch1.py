#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""重画「原图本身对不齐」的示意图 —— 第一批：嵌入式基础主线的 4 张。

用法：python tools/diagrams/fix_batch1.py
输出：docs/assets/diagrams/{pc-vs-embedded,stm32-mcu-block,nvic-irq-flow,pll-block}.svg
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from svglib import Canvas, PALETTE, DIM, INK, LINE, text_w, write  # noqa: E402

OUT = pathlib.Path(__file__).resolve().parents[2] / "docs" / "assets" / "diagrams"


def panel(canvas, x, y, w, h, title, tone):
    """外层分组框 + 顶部标题"""
    fill, stroke, title_fill = PALETTE[tone]
    canvas.rect(x, y, w, h, fill=fill, stroke=stroke, radius=14, width=1.5)
    canvas.mid_text(x + w / 2, y + 34, title, size=16, weight=700, fill=title_fill)


def inner(canvas, x, y, w, h, lines, tone="white", title=None):
    """组内的小方块（白底 + 分组色描边）"""
    _, stroke, _ = PALETTE[tone]
    canvas.rect(x, y, w, h, fill="#ffffff", stroke=stroke, radius=9, width=1.4)
    rows = ([title] if title else []) + list(lines)
    cursor = y + h / 2 - len(rows) * 9 + 5
    for index, value in enumerate(rows):
        canvas.mid_text(x + w / 2, cursor, value, size=13 if index or title else 13,
                        weight=700 if title and index == 0 else 400,
                        fill=INK if title and index == 0 else DIM)
        cursor += 18


# --------------------------------------------------------------------- 图 1
def pc_vs_embedded():
    c = Canvas(960, 430)
    c.card()

    panel(c, 28, 22, 444, 386, "PC（通用计算）", "slate")
    for index, name in enumerate(["浏览器", "VS Code", "播放器"]):
        inner(c, 55 + index * 130, 80, 112, 54, [name])
    c.mid_text(241, 156, "← 多任务（操作系统调度）", size=12, fill=DIM)
    inner(c, 55, 176, 356, 58, ["Windows / Linux 操作系统"])
    inner(c, 55, 252, 356, 58, ["Intel/AMD CPU + 内存 + 硬盘"])
    c.mid_text(233, 340, "通用 · 多任务 · 功耗高 · 断电即停", size=12, fill=DIM)

    panel(c, 488, 22, 444, 386, "嵌入式系统（专用）", "teal")
    inner(c, 515, 80, 356, 58, ["FreeRTOS（轻量实时操作系统）"])
    c.mid_text(693, 156, "↑ 可选：不跑 RTOS 也能裸机跑", size=12, fill=DIM)
    inner(c, 515, 176, 356, 74, ["STM32F407（ARM Cortex-M4, 168MHz）", "192KB RAM · 512KB Flash"])
    for index, name in enumerate(["GPIO", "UART", "CAN", "SPI"]):
        inner(c, 515 + index * 92, 268, 80, 52, [name])
    c.mid_text(699, 340, "↑ 外设直连：引脚上的信号自己管", size=12, fill=DIM)

    write(OUT / "pc-vs-embedded.svg", c, "PC 与嵌入式系统的对比",
          "左边是通用 PC：浏览器/编辑器/播放器多个任务由操作系统调度，下面是操作系统与 CPU/内存/硬盘；"
          "右边是嵌入式系统：可选的 FreeRTOS、STM32F407 本体、以及 GPIO/UART/CAN/SPI 等直连外设。")


# --------------------------------------------------------------------- 图 2
def stm32_mcu_block():
    c = Canvas(960, 452)
    c.card()
    c.rect(60, 20, 840, 412, fill="#f1f5f9", stroke="#cbd5e1", radius=14, width=1.5)
    c.mid_text(480, 52, "STM32 MCU", size=16, weight=700, fill="#334155")

    inner(c, 92, 74, 300, 78, [], tone="slate", title="Cortex-M4 内核")
    inner(c, 412, 74, 456, 78, ["程序存储"], tone="slate", title="Flash (512KB)")
    c.line(242, 152, 242, 188)
    inner(c, 92, 188, 776, 56, [], tone="slate", title="总线矩阵（Bus Matrix）")
    c.line(242, 244, 242, 280)
    c.line(148, 280, 812, 280, width=1.4)

    inner(c, 92, 300, 240, 74, ["数据存储"], tone="teal", title="RAM 192KB")
    inner(c, 352, 300, 240, 74, ["引脚控制"], tone="teal", title="GPIO × N")
    inner(c, 612, 300, 256, 74, ["串口"], tone="teal", title="UART")
    for x in (148, 472, 812):
        c.line(x, 280, x, 300)
    for index, name in enumerate(["SPI", "I2C", "CAN", "TIM"]):
        inner(c, 92 + index * 196, 392, 176, 40, [name], tone="amber")
    c.mid_text(480, 388, "外设总线：SPI / I2C / CAN / TIM …", size=12, fill="#8a6212")

    write(OUT / "stm32-mcu-block.svg", c, "STM32 MCU 内部结构",
          "Cortex-M4 内核与 Flash 挂在总线矩阵上，总线矩阵下接 RAM、GPIO、UART 以及 SPI/I2C/CAN/TIM 等外设。")


# --------------------------------------------------------------------- 图 3
def nvic_irq_flow():
    c = Canvas(960, 500)
    c.card()
    c.rect(60, 20, 840, 340, fill="#f1f5f9", stroke="#cbd5e1", radius=14, width=1.5)
    c.mid_text(480, 52, "Cortex-M4 内核", size=16, weight=700, fill="#334155")

    c.rect(100, 72, 760, 212, fill="#f4f1ff", stroke="#a99bea", radius=12, width=1.5)
    c.mid_text(480, 100, "NVIC", size=15, weight=700, fill="#4b3f9e")

    irq_x = [130, 235, 340, 610]
    for index, (x, name) in enumerate(zip(irq_x, ["IRQ0", "IRQ1", "IRQ2", "IRQn"])):
        inner(c, x, 120, 90, 46, [name], tone="violet")
        c.line(x + 45, 166, x + 45, 196)
    c.mid_text(505, 155, "…", size=18, fill="#4b3f9e")
    c.line(175, 196, 655, 196)
    c.line(480, 196, 480, 216)
    c.mid_text(480, 236, "优先级仲裁 + 嵌套管理", size=13, weight=700, fill="#4b3f9e")
    c.line(480, 244, 480, 268)
    c.arrow([(480, 244), (480, 282)], stroke="#7b6bd6")
    inner(c, 390, 286, 180, 44, ["CPU 核心"], tone="slate")

    for index, (name, x) in enumerate(zip(["CAN RX", "UART", "TIM IRQ"], [200, 400, 600])):
        inner(c, x, 392, 160, 48, [name], tone="amber")
        c.arrow([(x + 80, 392), (x + 80, 360)], stroke="#d9a441")
    c.note(790, 424, "← 外设中断信号", size=12)

    write(OUT / "nvic-irq-flow.svg", c, "NVIC 与外设中断",
          "CAN/UART/TIM 等外设的中断信号进入 NVIC 的 IRQ0…IRQn，经优先级仲裁与嵌套管理后交给 CPU 核心执行。")


# --------------------------------------------------------------------- 图 4
def pll_block():
    c = Canvas(960, 456)
    c.card()

    inner(c, 150, 96, 150, 76, ["(PFD)"], tone="blue", title="鉴相器")
    inner(c, 350, 96, 180, 76, ["(LPF)"], tone="blue", title="环路滤波器")
    inner(c, 580, 96, 160, 76, ["(VCO)"], tone="blue", title="压控振荡器")
    inner(c, 350, 286, 180, 74, ["(÷N)"], tone="violet", title="N 分频器")

    c.arrow([(46, 134), (150, 134)], stroke="#4051b5")
    c.mid_text(98, 122, "输入频率 f_in", size=12, fill="#4051b5")
    c.arrow([(300, 134), (350, 134)], stroke="#4051b5")
    c.arrow([(530, 134), (580, 134)], stroke="#4051b5")
    c.arrow([(740, 134), (900, 134)], stroke="#4051b5")
    c.mid_text(830, 122, "输出频率 f_out", size=12, fill="#4051b5")

    c.arrow([(660, 172), (660, 323), (530, 323)], stroke="#7b6bd6")
    c.arrow([(350, 323), (120, 323), (120, 134), (150, 134)], stroke="#7b6bd6")
    c.text(676, 300, "VCO 输出反馈回来分频", size=12, fill="#7b6bd6")

    c.legend(60, 384, 840, [
        "原理：VCO 产生高频信号 → ÷N 分频后与输入信号比较 → 调整 VCO 使分频后频率 = 输入频率",
        "锁定后：f_out / N = f_in，即 f_out = f_in × N/M",
    ])

    write(OUT / "pll-block.svg", c, "PLL 锁相环原理",
          "输入频率经鉴相器、环路滤波器、压控振荡器输出；VCO 输出经 N 分频器反馈回鉴相器，"
          "锁定后输出频率等于输入频率乘以 N/M。")


if __name__ == "__main__":
    pc_vs_embedded()
    stm32_mcu_block()
    nvic_irq_flow()
    pll_block()
