import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import styled from 'styled-components';

import logo from './assets/airtribe-logo.png';
import connectWalletButtonImg from './assets/connect-wallet-button.png';
import mintButtonImg from './assets/mint-button.png';
import './style.scss';

import tribeImg from './assets/tribe.jpg';

import arbiscanIcon from './assets/icons/arbiscan.png';
import telegramIcon from './assets/icons/telegram.png';
import twitterIcon from './assets/icons/twitter.png';
import webIcon from './assets/icons/web.png';

import arbtribeABI from 'web3/contracts/abis/ARBTribe.json';
import {
  useBalance,
  useAccount,
  useConnect,
  useContract,
  useProvider,
  useSigner,
} from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';

import { BigNumber, ethers } from 'ethers';
import { LoadingIndicator } from 'app/components/LoadingIndicator';

export function HomePage() {
  const { address, isConnected } = useAccount();
  const [mintFee, setMintFee] = useState<BigNumber | undefined>();
  const [count, setCount] = useState<number>(1);

  const [isDiscountApplied, setIsDiscountApplied] = useState<
    boolean | undefined
  >();
  const totalTokens = 555;
  const [mintedTokens, setMintedTokens] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isMinting, setIsMinting] = useState<boolean>(false);
  const provider = useProvider();
  const { data: signer } = useSigner();

  const [mintedipfsUrls, setMintedipfsUrls] = React.useState<
    string[] | undefined
  >();

  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });

  const contract = useContract({
    address: '0xa5732abd1ffc6c3864c84461c275bb75e81ea9ec',
    abi: arbtribeABI,
    signerOrProvider: signer ?? provider,
  });
  const tribeContract = useContract({
    address: '0x58EA7917F74834dbE6b57D0a2a74fb68C1e94c55',
    abi: arbtribeABI,
    signerOrProvider: signer,
  });
  const nfaContract = useContract({
    address: '0x54cfe852BEc4FA9E431Ec4aE762C33a6dCfcd179',
    abi: arbtribeABI,
    signerOrProvider: signer,
  });

  const tryConnectWallet = () => {
    connect();
  };

  const tryFetchFeePrice = async () => {
    setMintFee(await contract!.fullMintPrice());
  };
  const tryFetchMintedTokensCount = async () => {
    const tokens = await contract!.getMintedTokens();
    setMintedTokens(tokens.length);
  };
  const tryMint = async () => {
    setErrorMessage(undefined);
    const totalPrice = mintFee!.mul(BigNumber.from(count));
    const balance = await provider.getBalance(address!);
    const paymentAmount = totalPrice
      .mul(BigNumber.from(101))
      .div(BigNumber.from(100));
    const amountInEth = await contract!.getPriceInETH(paymentAmount);

    if (amountInEth.gt(balance)) {
      setErrorMessage('Insufficient Balance');
      return;
    }

    const transaction = await contract!.mint(count, {
      value: amountInEth,
    });
    setIsMinting(true);
    try {
      const result = await transaction.wait();
      const transfers = result.events.filter(e => e.event === 'Transfer');
      const tokenIds = transfers.map(transfer => transfer.topics[3]);
      const ipfsUrls = await Promise.all(
        tokenIds.map(tokenId => contract!.tokenURI(tokenId)),
      );
      setMintedipfsUrls(ipfsUrls);
      tryFetchMintedTokensCount();
      setIsMinting(false);
    } catch (e) {
      setIsMinting(false);
    }
  };

  const checkForDiscount = async () => {
    const minTribeToHold = await contract!.minTribeToHold();
    const tribeBalance: BigNumber = await tribeContract!.balanceOf(address);
    if (tribeBalance.gte(minTribeToHold)) {
      setMintFee(await contract!.tribeDiscountPrice());
      setIsDiscountApplied(true);
      alert('You are eligible for discount');
      return;
    }
    const minNFAToHold = await contract!.minNFAToHold();
    const nfaBalance: BigNumber = await nfaContract!.balanceOf(address);
    if (nfaBalance.gte(minNFAToHold)) {
      setMintFee(await contract!.nfaDiscountPrice());
      setIsDiscountApplied(true);
      alert('You are eligible for discount');
      return;
    }
    alert('You are not eligible for discount');
    setIsDiscountApplied(false);
  };

  useEffect(() => {
    tryFetchFeePrice();
    tryFetchMintedTokensCount();
  }, []);

  const mintFeeLabel =
    mintFee != undefined
      ? ethers.utils.formatUnits(mintFee, 6) + '$'
      : undefined;

  return (
    <>
      <Helmet>
        <title>Home Page</title>
        <meta name="description" />
      </Helmet>
      <div id="homePage">
        <div className="wrapper grid grid-cols-1 lg:grid-cols-3 lg:pb-48">
          <div className="flex flex-col justify-center items-center">
            <div className="stat">
              <div className="grid grid-cols-2 gap-1">
                <div>Mint: {mintedTokens}</div>
                <div>Total: {totalTokens}</div>
                <div>Fee : {mintFeeLabel}</div>
                <div>
                  Discount : {isDiscountApplied === true && 'Applied'}{' '}
                  {isDiscountApplied === false && 'N/A'}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-5">
                <span className="progress-bar flex-1">
                  <span
                    style={{
                      width: `${(mintedTokens / totalTokens) * 100}%`,
                    }}
                  />
                </span>
                <span style={{ fontSize: '1.8rem' }}>
                  {mintedTokens}/{totalTokens}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center items-center">
            <img src={logo} style={{ height: 80 }} />
            <br />
            <br />
            <div className="flex justify-center mb-10">
              {isConnected ? (
                <>
                  {isMinting === false ? (
                    <div className="flex flex-col gap-4 items-center">
                      <div className="flex gap-3 items-center">
                        <PrimaryButton
                          className="square"
                          onClick={() => setCount(c => Math.max(1, c - 1))}
                        >
                          -
                        </PrimaryButton>

                        <PrimaryButton
                          onClick={tryMint}
                          style={{ width: 160 }}
                          className="flex flex-col justify-center items-center"
                        >
                          <img src={mintButtonImg} style={{ height: 30 }} />
                          <div>
                            {count} TRIBE NFT{count > 1 && 's'}
                          </div>
                        </PrimaryButton>

                        <PrimaryButton
                          className="square"
                          onClick={() =>
                            setCount(c =>
                              Math.min(totalTokens - mintedTokens, c + 1),
                            )
                          }
                        >
                          +
                        </PrimaryButton>
                      </div>
                      {errorMessage && (
                        <span className="text-red-500 text-xl">
                          {errorMessage}
                        </span>
                      )}
                      <SecondaryButton onClick={checkForDiscount}>
                        CHECK FOR DISCOUNT
                      </SecondaryButton>
                    </div>
                  ) : (
                    <span>Minting....</span>
                  )}
                </>
              ) : (
                <PrimaryButton onClick={tryConnectWallet}>
                  <img src={connectWalletButtonImg} style={{ height: 20 }} />
                </PrimaryButton>
              )}
            </div>
          </div>
          <div></div>
        </div>
        <div className="links">
          <a href="https://KekTribe.info ">
            <img src={webIcon} />
          </a>
          <a href="https://t.me/arbtribe">
            <img src={telegramIcon} />
          </a>
          <a href="https://Twitter.com/kektribe">
            <img src={twitterIcon} />
          </a>
          <a href="https://arbiscan.io/address/0xa5732abd1ffc6c3864c84461c275bb75e81ea9ec">
            <img src={arbiscanIcon} />
          </a>
        </div>
        <div className="bg">
          <img src={tribeImg} className="tribe-img" />
          <div className="fire" />
          <div className="pepe-fry" />
          <div className="fire" />
          <div className="fire-wood" />
        </div>
        {mintedipfsUrls && (
          <Modal
            ipfsUrls={mintedipfsUrls}
            onClose={() => setMintedipfsUrls(undefined)}
          />
        )}
      </div>
    </>
  );
}

const PrimaryButton = styled.button`
  border: 2px solid #ffffff;
  padding: 10px 15px;
  background: transparent;
  &.square {
    width: 40px;
    height: 40px;
    padding: 0;
  }
  display &:hover {
    transform: scale(1.05);
  }
  &:active {
    transform: scale(0.95);
  }
`;

const SecondaryButton = styled.button`
  padding: 10px 15px;
  background: transparent;
  display &:hover {
    transform: scale(1.05);
  }
  &:active {
    transform: scale(0.95);
  }
`;

export default function Modal({
  onClose,
  ipfsUrls,
}: {
  onClose: () => void;
  ipfsUrls: string[];
}) {
  const gatwayPrefix = 'https://cloudflare-ipfs.com/ipfs/';

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useEffect(() => {
    setImageUrls([]);
    const ipfsIds = ipfsUrls.map(u => u.slice(7));
    const gatewayUrls = ipfsIds.map(id => gatwayPrefix + id);

    const controllers = gatewayUrls.map(c => new AbortController());
    gatewayUrls.forEach((url, index) => {
      fetch(url, { signal: controllers[index].signal })
        .then(response => response.json())
        .then(data =>
          setImageUrls(urls => [...urls, gatwayPrefix + data.image.slice(7)]),
        );
    });

    return () => controllers.forEach(controller => controller.abort());
  }, []);
  return (
    <>
      <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
        <div className="relative w-auto my-6 mx-auto max-w-xl  max-h-full dark:bg-gray-700">
          {/*content*/}
          <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full  h-full outline-none focus:outline-none">
            <div className="relative p-6 flex-auto">
              <p className="my-4 text-white text-lg leading-relaxed">
                <h2 className="mb-5 text-center">Mint Success!</h2>
                {imageUrls.length > 0 ? (
                  <>
                    <img
                      src={imageUrls[currentIndex]}
                      style={{ width: '100%' }}
                    />
                    <div className="mt-2 flex items-center justify-center">
                      <PrimaryButton
                        className="square"
                        onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                      >
                        &lt;
                      </PrimaryButton>
                      <span className="px-3">
                        {currentIndex + 1} / {imageUrls.length}
                      </span>
                      <PrimaryButton
                        className="square"
                        onClick={() =>
                          setCurrentIndex(i =>
                            Math.min(imageUrls.length - 1, i + 1),
                          )
                        }
                      >
                        &gt;
                      </PrimaryButton>
                    </div>
                  </>
                ) : (
                  <LoadingIndicator />
                )}
              </p>
            </div>
            {/*footer*/}
            <div className="flex items-center justify-end p-6 pt-0 border-trounded-b">
              <button
                className="text-white background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                type="button"
                onClick={onClose}
              >
                (X) Close
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
    </>
  );
}
