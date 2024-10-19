'use client'

import erc20ABI from "@/src/abi/erc20";
import AppProviders from "@/app/AppProviders";
import Head from "next/head";
import { useState } from "react";
import { useAccount, useReadContracts } from "wagmi";
import { base } from "wagmi/chains";

function ShipAmmoContent() {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const lower48States = [
    "AL", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "ID", "IL", "IN", "IA", "KS", "KY",
    "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY",
    "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA",
    "WV", "WI", "WY"
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add your form submission logic here, such as sending the data to an API
    console.log('Form submitted:', formData);
  };

  const { data } = useReadContracts({
    contracts: [{
      abi: erc20ABI,
      address: '0x6b175474e89094c44da98b954eedeac495271d0f',
      functionName: 'balanceOf',
      chainId: base.id,
      args: [`0x0`]
    },
    {
      abi: erc20ABI,
      address: '0x6b175474e89094c44da98b954eedeac495271d0f',
      functionName: 'balanceOf',
      chainId: base.id,
      args: [`0x0`]
    }]
  })
  const account = useAccount()

  return (
    <>
      <Head>
        <title>Ammo.wtf | Request Shipment</title>
      </Head>
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <form 
          onSubmit={handleSubmit} 
          className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md"
        >
          <h1 className="text-xl font-bold mb-4">Shipping Information</h1>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
              Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="city">
              City
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="state">
              State
            </label>
            <select
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">Select a state</option>
              {lower48States.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="zipCode">
              Zip Code
            </label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              required
              pattern="^\d{5}(-\d{4})?$"
              title="Please enter a valid 5-digit or 9-digit zip code"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Submit
            </button>
          </div>
          </form>
      </div>
    </>
  );
}

export default function ShipAmmo() {
  return <AppProviders>
  <ShipAmmoContent />
</AppProviders>
}