import { useState, useEffect } from 'react';
import { FaSun, FaMoon, FaExchangeAlt } from 'react-icons/fa';
import './App.css';

const fiatSymbols = ["USD", "EUR", "GBP", "JPY", "TRY", "AUD", "CAD"];
const cryptoSymbols = ["BTC", "ETH", "LTC", "DOGE", "BNB", "SOL", "XRP"];

const coinGeckoIds = {
  BTC: "bitcoin",
  ETH: "ethereum",
  LTC: "litecoin",
  DOGE: "dogecoin",
  BNB: "binancecoin",
  SOL: "solana",
  XRP: "ripple"
};

const currencyOptions =[fiatSymbols, ...cryptoSymbols];

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  const resetResult = () => {
    setConverted(null);
    setConvertedAmount(null);
    setLastUpdated(null);
  };

  const [amount, setAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [converted, setConverted] = useState(null);
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [conversionType, setConversionType] = useState("");

  const handleConvert = async () => {
    if (!amount || isNaN(amount)) return;

    if (fromCurrency === toCurrency) {
      setConverted("1");
      setConvertedAmount(amount);
      setLastUpdated(new Date().toISOString().slice(0, 10));
      setConversionType("same");
      return;
    }
  
    const isFromCrypto = cryptoSymbols.includes(fromCurrency);
    const isToCrypto = cryptoSymbols.includes(toCurrency);
  
    try {
      if (!isFromCrypto && !isToCrypto) {
        // Fiat → Fiat via Frankfurter
        const res = await fetch(`https://api.frankfurter.app/latest?amount=${amount}&from=${fromCurrency}&to=${toCurrency}`);
        const data = await res.json();
        const rate = data.rates[toCurrency];
  
        if (rate !== undefined) {
          setConverted(rate.toFixed(4));
          setConversionType("fiat");
          setConvertedAmount(amount);
          setLastUpdated(data.date);
        } else {
          setConverted("Conversion failed");
        }
  
      } else if (isFromCrypto && !isToCrypto) {
        // Crypto → Fiat via CoinGecko
        const coinId = coinGeckoIds[fromCurrency];
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${toCurrency.toLowerCase()}`);
        const data = await res.json();
        const price = data[coinId]?.[toCurrency.toLowerCase()];
  
        if (price !== undefined) {
          const result = price * parseFloat(amount);
          setConverted(result.toFixed(4));
          setConversionType("crypto-to-fiat");
          setConvertedAmount(amount);
          setLastUpdated(new Date().toISOString().slice(0, 10));
        } else {
          setConverted("Conversion failed");
        }
  
      } else if (!isFromCrypto && isToCrypto) {
        // Fiat → Crypto via CoinGecko
        const coinId = coinGeckoIds[toCurrency];
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${fromCurrency.toLowerCase()}`);
        const data = await res.json();
        const price = data[coinId]?.[fromCurrency.toLowerCase()];
  
        if (price !== undefined && price !== 0) {
          const result = parseFloat(amount) / price;
          setConverted(result.toFixed(8));
          setConversionType("fiat-to-crypto");
          setConvertedAmount(amount);
          setLastUpdated(new Date().toISOString().slice(0, 10));
        } else {
          setConverted("Conversion failed");
        }
  
      } else {
        // Crypto → Crypto via CoinGecko (use USD as bridge)
        const fromId = coinGeckoIds[fromCurrency];
        const toId = coinGeckoIds[toCurrency];

        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${fromId},${toId}&vs_currencies=usd`);
        const data = await res.json();

        const fromToUSD = data[fromId]?.usd;
        const toToUSD = data[toId]?.usd;

        if (fromToUSD !== undefined && toToUSD !== undefined && toToUSD !== 0) {
          const rate = fromToUSD / toToUSD;
          const result = parseFloat(amount) * rate;
          setConverted(result.toFixed(8));
          setConversionType("crypto-to-crypto");
          setConvertedAmount(amount);
          setLastUpdated(new Date().toISOString().slice(0, 10));
        } else {
          setConverted("Conversion failed");
        }
      }
  
    } catch (error) {
      console.error("Conversion error:", error);
      setConverted("Error fetching conversion");
    }
  };
  

  const handleSwap = () => {
    const temp = fromCurrency
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    resetResult();
  }

  return (
    <div className='min-h-screen transition-colors duration-300'>
      <header className='max-w-7xl mx-auto p-6 flex justify-between items-center shadow-md'>
        <h1 className='text-2xl font-bold'>OrbitRates</h1>
        <button
          onClick={toggleTheme}
          className='text-2xl p-2 rounded-full transition-colors duration-300 hover:bg-zinc-300 dark:hover:bg-zinc-700'
          aria-label="Toggle Theme"
        >
          {theme === "light" ? (
            <FaMoon className="transition-transform duration-500 transform rotate-0" />
          ) : (
            <FaSun className="transition-transform duration-500 transform rotate-180 text-yellow-400" />
          )}
        </button>
      </header>

      <main className='p-6 min-h-screen bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white'>
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded shadow w-full max-w-3xl mx-auto space-y-6">
                <div className="flex flex-col items-start gap-1">
                  <label htmlFor="amount" className="block text-left text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                  <div className="flex items-center gap-2">
                    <input
                    id='amount'
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="p-2 rounded bg-white dark:bg-zinc-700 dark:text-white"
                      placeholder='Enter amount'
                    />
                    <button
                      onClick={() => {
                        setAmount("");
                        resetResult();
                      }}
                      disabled={!amount}
                      className={`px-3 py-2 rounded transition-colors 
                      ${amount ? "bg-red-600 hover:bg-red-700 text-white" : "bg-gray-400 text-gray-200 cursor-not-allowed"}`}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-left text-gray-700 dark:text-gray-300 mb-1">From</label>
                    <select
                      value={fromCurrency}
                      onChange={(e) => {
                        setFromCurrency(e.target.value);
                        resetResult();
                      }}
                      className="w-full p-2 rounded bg-zinc-300 dark:bg-zinc-700 dark:text-white"
                    >
                      <optgroup label='Fiat'>
                        {fiatSymbols.map((cur) => (
                          <option key={cur} value={cur}>{cur}</option>
                        ))}
                      </optgroup>
                      <optgroup label='Crypto'>
                        {cryptoSymbols.map((cur) => (
                          <option key={cur} value={cur}>{cur}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <button
                    onClick={handleSwap}
                    className='mb-1 px-3 py-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-transform duration-300'
                  >
                    <FaExchangeAlt className="text-xl hover:rotate-180 transform transition-transform duration-300" />
                  </button>

                  <div className="flex-1">
                    <label className="block text-left text-gray-700 dark:text-gray-300 mb-1">To</label>
                    <select
                      value={toCurrency}
                      onChange={(e) => {
                        setToCurrency(e.target.value);
                        resetResult();
                      }}
                      className="w-full p-2 rounded bg-zinc-300 dark:bg-zinc-700 dark:text-white"
                    >
                      <optgroup label='Fiat'>
                        {fiatSymbols.map((cur) => (
                          <option key={cur} value={cur}>{cur}</option>
                        ))}
                      </optgroup>
                      <optgroup label='Crypto'>
                        {cryptoSymbols.map((cur) => (
                          <option key={cur} value={cur}>{cur}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleConvert}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                >
                  Convert
                </button>

                {converted !== null && convertedAmount !== null && (
                  <div className="text-xl font-semibold mt-4">
                    {convertedAmount} {fromCurrency} = {converted} {toCurrency}

                    {conversionType === "crypto-to-crypto" && (
                      <p className='text-sm text-gray-500 dark:text-gray-400 mt-1 italic'>
                        (Using USD as intermediate currency)
                      </p>
                    )}

                    {conversionType === "same" && (
                      <p className='text-sm text-gray-500 dark:text-gray-400 mt-1 italic'>
                        (No conversion needed)
                      </p>
                    )}

                    {lastUpdated && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Last Updated: {lastUpdated}
                      </p>
                    )}
                  </div>
                )}
              </div>

            </div>

            <div className="flex items-center justify-center min-h-[300px] border border-dashed border-gray-400 dark:border-gray-600 rounded">
              <span className="text-gray-500 dark:text-gray-400">Chart will go here</span>
            </div>
          </div>
      </main>
    </div>
  );
}

export default App
