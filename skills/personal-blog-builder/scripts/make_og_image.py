#!/usr/bin/env python3
"""把一张图（通常是正方形插画）重排成 1200x630 的社交分享封面（OG image）。

做法：按高度缩放原图，左右用原图边缘列像素无缝延伸填满画布。
好处：角色/构图 100% 保留，无水印、无 AI 角色漂移，背景连续。

用法：
    python3 make_og_image.py --input hero.png --output public/og-cover.png
    python3 make_og_image.py -i hero.png -o og.png --align left --width 1200 --height 630

依赖：Pillow（pip install Pillow）
"""

import argparse
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("缺少 Pillow，请先执行：pip install Pillow")


def build(input_path: str, output_path: str, width: int, height: int, align: str) -> None:
    src = Image.open(input_path).convert("RGBA")

    scale = height / src.height
    scaled_w = max(1, int(round(src.width * scale)))
    art = src.resize((scaled_w, height), Image.LANCZOS)

    canvas = Image.new("RGBA", (width, height))

    # 原图比画布还宽：居中/按方向裁切，避免拉伸变形
    if scaled_w >= width:
        if align == "left":
            box = (0, 0, width, height)
        elif align == "right":
            box = (scaled_w - width, 0, scaled_w, height)
        else:
            left = (scaled_w - width) // 2
            box = (left, 0, left + width, height)
        canvas.paste(art.crop(box), (0, 0))
        canvas.convert("RGB").save(output_path, "PNG")
        return

    # 原图比画布窄：用左右边缘列像素延伸背景
    left_edge = art.crop((0, 0, 1, height))
    right_edge = art.crop((scaled_w - 1, 0, scaled_w, height))

    if align == "left":
        x0 = 0
    elif align == "right":
        x0 = width - scaled_w
    else:
        x0 = (width - scaled_w) // 2

    for x in range(x0):
        canvas.paste(left_edge, (x, 0))
    canvas.paste(art, (x0, 0), art)
    for x in range(x0 + scaled_w, width):
        canvas.paste(right_edge, (x, 0))

    canvas.convert("RGB").save(output_path, "PNG")
    print(f"✅ 已生成 {output_path} ({width}x{height}, align={align})")


def main() -> None:
    p = argparse.ArgumentParser(description="生成 1.91:1 的 OG 社交分享封面")
    p.add_argument("-i", "--input", required=True, help="源图路径")
    p.add_argument("-o", "--output", required=True, help="输出路径（建议放 public/og-cover.png）")
    p.add_argument("--width", type=int, default=1200)
    p.add_argument("--height", type=int, default=630)
    p.add_argument("--align", choices=["center", "left", "right"], default="center",
                   help="主体位置；center 最稳，left/right 适合一侧留白")
    a = p.parse_args()

    if a.width / a.height < 1.8 or a.width / a.height > 2.0:
        print("⚠️  建议保持 1.91:1（1200x630），否则部分平台会裁切", file=sys.stderr)

    build(a.input, a.output, a.width, a.height, a.align)


if __name__ == "__main__":
    main()
