/* eslint-disable @next/next/no-img-element */
const tokens = [
  {
    name: "9mm - training",
    symbol: "9t",
    address: "0x0",
  },
  {
    name: "9mm - defensive",
    symbol: "9d",
    address: "0x0",
  },
  {
    name: "5.56x45mm NATO - training",
    symbol: "5.56t",
    address: "0x0",
  },
  {
    name: "5.56x45mm NATO - defensive",
    symbol: "5.56d",
    address: "0x0",
  },
];

export default function Dashboard() {
  return (
    <div className="bg-slate-900 text-gray-200 min-h-[100vh]">
      <section className="rounded-2xl flex flex-col bg-slate-800 mx-4">
        <div className="flex flex-row justify-between h-16">
          <h2 className="flex items-center font-semibold text-2xl px-3">
            Balances
          </h2>
          <h2 className="flex items-center font-semibold text-2xl px-3">
            ${999.99}
          </h2>
        </div>
        <div>
          <div className="text-gray-300 py-3 border-t font-semibold border-slate-700 text-sm bg-slate-600 px-3 items-center justify-between flex">
            <div className="flex-1">Asset</div>
            <div className="flex-1 text-right">Price</div>
            <div className="flex-1 text-right">Balance</div>
            <div className="flex-1 text-right">Value</div>
          </div>
          {tokens.map((token) => (
            <div
              key={token.address}
              className="border-t border-slate-700 flex items-center justify-between px-3 h-12 hover:bg-slate-700 transition duration-150 ease-in-out"
            >
              <div className="flex items-center gap-3 flex-1 overflow-hidden">
                <div className="relative min-w-[36px] max-w-full flex items-center">
                  <img
                    src={`https://github.com/trustwallet/assets/blob/master/blockchains/base/assets/${token.address}/logo.png?raw=true`}
                    alt={token.name}
                    className="w-8 h-8 rounded-full"
                  />
                </div>
                <div className="font-semibold truncate">{token.name}</div>
              </div>
              <div className="flex-1 text-right">{token.price ?? "price"}</div>
              <div className="flex-1 text-right">
                {token.balance ?? "balance"}
              </div>
              <div className="flex justify-end flex-1 text-right">
                {token.value ?? "value"}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
