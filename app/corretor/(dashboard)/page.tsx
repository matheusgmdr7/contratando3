"use client"

const DashboardPage = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white shadow rounded-lg p-3 md:p-4">
          <h2 className="text-lg md:text-xl font-semibold mb-2">Card Title 1</h2>
          <p>Some content for card 1.</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white shadow rounded-lg p-3 md:p-4">
          <h2 className="text-lg md:text-xl font-semibold mb-2">Card Title 2</h2>
          <p>Some content for card 2.</p>
        </div>

        {/* Card 3 */}
        <div className="bg-white shadow rounded-lg p-3 md:p-4">
          <h2 className="text-lg md:text-xl font-semibold mb-2">Card Title 3</h2>
          <p>Some content for card 3.</p>
        </div>

        {/* Card 4 */}
        <div className="bg-white shadow rounded-lg p-3 md:p-4">
          <h2 className="text-lg md:text-xl font-semibold mb-2">Card Title 4</h2>
          <p>Some content for card 4.</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Table Example</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow rounded-lg">
            <thead>
              <tr>
                <th className="px-4 py-2">Header 1</th>
                <th className="px-4 py-2">Header 2</th>
                <th className="px-4 py-2">Header 3</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-4 py-2">Data 1</td>
                <td className="border px-4 py-2">Data 2</td>
                <td className="border px-4 py-2">Data 3</td>
              </tr>
              <tr>
                <td className="border px-4 py-2">Data 4</td>
                <td className="border px-4 py-2">Data 5</td>
                <td className="border px-4 py-2">Data 6</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Chart Example</h2>
        <p>Placeholder for a chart component.</p>
      </div>
    </div>
  )
}

export default DashboardPage
