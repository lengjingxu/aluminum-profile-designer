import { generateMaterialList } from '../../lib/calculator'
import { exportToCSV } from '../../lib/exporter'

// 材料清单 - 型材统计 + 配件清单 + 成本汇总
export default function MaterialList({ elements }) {
  const materialData = generateMaterialList(elements)
  const { profiles, accessories, cost } = materialData

  const hasProfiles = Object.keys(profiles).length > 0

  return (
    <div className="p-4 bg-card border-l border-divider flex flex-col gap-4 max-h-[400px] overflow-y-auto">
      <div className="text-accent text-sm font-bold">📊 材料清单</div>

      {/* 型材统计 */}
      <div>
        <div className="text-xs text-text-secondary mb-2">型材统计</div>
        {hasProfiles ? (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-text-secondary border-b border-divider">
                <th className="py-1 text-left">规格</th>
                <th className="py-1 text-right">数量</th>
                <th className="py-1 text-right">总长(m)</th>
                <th className="py-1 text-right">重量(kg)</th>
                <th className="py-1 text-right">价格(元)</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(profiles).map(stat => (
                <tr key={stat.specId} className="border-b border-divider/30">
                  <td className="py-1 text-text">{stat.specId}</td>
                  <td className="py-1 text-text text-right">{stat.count}</td>
                  <td className="py-1 text-text text-right">{stat.totalLengthM.toFixed(2)}</td>
                  <td className="py-1 text-text text-right">{stat.totalWeightKg.toFixed(2)}</td>
                  <td className="py-1 text-accent text-right">{stat.totalPrice.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-xs text-text-secondary">暂无型材数据</div>
        )}
      </div>

      {/* 配件清单 */}
      <div>
        <div className="text-xs text-text-secondary mb-2">配件清单</div>
        {hasProfiles ? (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-text-secondary border-b border-divider">
                <th className="py-1 text-left">名称</th>
                <th className="py-1 text-right">数量</th>
                <th className="py-1 text-right">单价</th>
                <th className="py-1 text-right">总价</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(accessories).map(acc => (
                <tr key={acc.id} className="border-b border-divider/30">
                  <td className="py-1 text-text">{acc.name}</td>
                  <td className="py-1 text-text text-right">{acc.count}</td>
                  <td className="py-1 text-text text-right">{acc.pricePerUnit}元</td>
                  <td className="py-1 text-accent text-right">{(acc.count * acc.pricePerUnit).toFixed(1)}元</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-xs text-text-secondary">暂无配件数据</div>
        )}
      </div>

      {/* 成本汇总 */}
      {hasProfiles && (
        <div className="border-t border-divider pt-2">
          <div className="text-xs text-text-secondary mb-2">成本汇总</div>
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex justify-between text-text">
              <span>型材成本</span>
              <span>{cost.profileCost.toFixed(2)} 元</span>
            </div>
            <div className="flex justify-between text-text">
              <span>配件成本</span>
              <span>{cost.accessoryCost.toFixed(2)} 元</span>
            </div>
            <div className="flex justify-between text-text">
              <span>加工费({(cost.processingFeeRate * 100).toFixed(0)}%)</span>
              <span>{cost.processingFee.toFixed(2)} 元</span>
            </div>
            <div className="flex justify-between text-accent font-bold pt-1 border-t border-divider">
              <span>总成本</span>
              <span>{cost.totalCost.toFixed(2)} 元</span>
            </div>
          </div>
        </div>
      )}

      {/* 导出按钮 */}
      {hasProfiles && (
        <button
          className="px-3 py-2 bg-accent/20 text-accent rounded text-sm hover:bg-accent/30 transition-colors"
          onClick={() => exportToCSV(materialData)}
        >
          📥 导出材料清单CSV
        </button>
      )}
    </div>
  )
}
