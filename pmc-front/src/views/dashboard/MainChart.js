import React, { useEffect, useMemo, useRef } from 'react'

import { CChartLine } from '@coreui/react-chartjs'
import { getStyle } from '@coreui/utils'

const paletteToColor = (colorVar, alpha = 1) => {
  if (!colorVar) return undefined
  if (alpha === 1) {
    return getStyle(`--cui-${colorVar}`)
  }
  return `rgba(${getStyle(`--cui-${colorVar}-rgb`)}, ${alpha})`
}

const MainChart = ({ labels = [], datasets = [] }) => {
  const chartRef = useRef(null)

  useEffect(() => {
    const handler = () => {
      if (!chartRef.current) return
      setTimeout(() => {
        const chart = chartRef.current
        const xGrid = chart.options.scales.x.grid
        const yGrid = chart.options.scales.y.grid
        const xTicks = chart.options.scales.x.ticks
        const yTicks = chart.options.scales.y.ticks
        xGrid.borderColor = getStyle('--cui-border-color-translucent')
        xGrid.color = getStyle('--cui-border-color-translucent')
        xTicks.color = getStyle('--cui-body-color')
        yGrid.borderColor = getStyle('--cui-border-color-translucent')
        yGrid.color = getStyle('--cui-border-color-translucent')
        yTicks.color = getStyle('--cui-body-color')
        chart.update()
      })
    }

    document.documentElement.addEventListener('ColorSchemeChange', handler)
    return () => document.documentElement.removeEventListener('ColorSchemeChange', handler)
  }, [])

  const resolvedDatasets = useMemo(() => {
    if (!Array.isArray(datasets) || datasets.length === 0) return []
    return datasets.map((dataset, index) => {
      const color =
        dataset.borderColor || paletteToColor(dataset.colorVar) || getStyle('--cui-info')
      const background =
        dataset.backgroundColor || paletteToColor(dataset.colorVar, 0.1) || 'rgba(255,255,255,0.05)'
      return {
        label: dataset.label || `Dataset ${index + 1}`,
        data: dataset.data || [],
        borderColor: color,
        backgroundColor: dataset.fill ? background : 'transparent',
        pointHoverBackgroundColor: color,
        borderWidth: dataset.borderWidth ?? 2,
        fill: dataset.fill ?? false,
        borderDash: dataset.borderDash,
        tension: dataset.tension ?? 0.4,
      }
    })
  }, [datasets])

  const hasSamples =
    Array.isArray(labels) &&
    labels.length > 0 &&
    resolvedDatasets.some((dataset) => Array.isArray(dataset.data) && dataset.data.length > 0)

  if (!hasSamples) {
    return (
      <div className="text-center text-body-secondary py-5">
        No efficiency readings yet. Once projects report progress, this chart will populate.
      </div>
    )
  }

  return (
    <CChartLine
      ref={chartRef}
      style={{ height: '300px', marginTop: '40px' }}
      data={{
        labels,
        datasets: resolvedDatasets,
      }}
      options={{
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            grid: {
              color: getStyle('--cui-border-color-translucent'),
              drawOnChartArea: false,
            },
            ticks: {
              color: getStyle('--cui-body-color'),
            },
          },
          y: {
            beginAtZero: true,
            border: {
              color: getStyle('--cui-border-color-translucent'),
            },
            grid: {
              color: getStyle('--cui-border-color-translucent'),
            },
            ticks: {
              color: getStyle('--cui-body-color'),
              maxTicksLimit: 5,
            },
          },
        },
        elements: {
          line: {
            tension: 0.4,
          },
          point: {
            radius: 0,
            hitRadius: 10,
            hoverRadius: 4,
            hoverBorderWidth: 3,
          },
        },
      }}
    />
  )
}

export default MainChart
