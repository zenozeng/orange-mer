# Orange MER

识别并标示橘子轮廓并显示最小外接矩。

## Demo

http://zenozeng.github.io/orange-mer-detect/

因为是直接在浏览器UI线程里计算，而且没有做分片优化，所以有点卡。
以及，请使用现代浏览器（Chrome / Firefox / 360或者搜狗等浏览器的急速模式）

## 用到的算法

- 基于图像 HSL 分量中饱和度分量作为二值化划分

- 基于泛洪算法的孤点去除与主要区域判定

    - http://blog.csdn.net/jia20003/article/details/8908464

- MER 计算

- 完全基于 Canvas 计算过程与结果输出
