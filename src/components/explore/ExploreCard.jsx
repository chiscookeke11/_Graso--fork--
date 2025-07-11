import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Timer from "../Timer";
// import landsite from "../../assets/landsite.jpg";
import sui from "../../assets/sui.png";
import { Link, useLocation } from "react-router-dom";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { contributeToCampaign, getProjectInfo } from "../../utils";

export default function ExploreCard({ data }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [contributionAmount, setContributionAmount] = useState("");
  const [isHome, setIsHome] = useState(false);
  const [isContributing, setIsContributing] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isShowingFullDescription, setIsShowingFullDescription] = useState(false);
  const modalRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [_digest, setDigest] = useState("");


  useEffect(() => {
    setIsHome(location.pathname === "/");
  }, [location.pathname]);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const toggleMapModal = () => {
    setIsMapModalOpen(!isMapModalOpen);
  };

  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      setIsModalOpen(false);
      setIsMapModalOpen(false);
    }
  };

  const handleContribute = async (e) => {
    e.preventDefault();
    if (!contributionAmount) return;

    setIsContributing(true);

    // Convert contributionAmount to a BigInt
    const amountInMicroSUI = BigInt(Number(contributionAmount) * 1e9);

    const txn = await contributeToCampaign(
      data.id,
      Number(amountInMicroSUI)
    );
    signAndExecuteTransaction(
      {
        transaction: txn,
        chain: "sui:testnet",
      },
      {
        onSuccess: async (result) => {
          const updatedCampaign = await getProjectInfo(data.id);
          setCampaign(updatedCampaign);
          setContributionAmount("");
          setDigest(result.digest);
          setIsContributing(false);
          navigate("/dashboard");
        },
        onError: (error) => {
          console.error("Error contributing:", error);
        },
      }
    );
  };

  useEffect(() => {
    if (isModalOpen || isMapModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.pointerEvents = "none";
      document.body.style.overflow = "hidden";
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.pointerEvents = "";
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModalOpen, isMapModalOpen]);

  const truncateDescription = (text) => {
    if (!text) return '';
    if (text.length <= 100) return text;
    return text.slice(0, 100) + '...';
  };

  return (
    <div className="flex flex-col justify-between rounded-t-[2.1rem] rounded-b-3xl bg-[#24C2A5] w-[20rem] h2rem] space-y-1 min-w-[250px]">
      <div className="bg-white rounded-b-3xl rounded-t-[2rem] flex-grow overflow-hidden">
        <div className="p-4 w-full h-full flex flex-col justify-between">
          <img
            // src={landsite}
            src={`https://gateway.pinata.cloud/ipfs/${data.image}?pinataGatewayToken=${import.meta.env.VITE_GATEWAY_TOKEN}`}
            className="w-full h-40 object-cover"
            alt={data.title}
          />
          <div className="flex-grow">
            <h1 className="font-bold pt-4 text-2xl">{data.title}</h1>
            <h2 className="text-gray-400">{`Longitude: ${data.longitude}`}</h2>
            <h2 className="text-gray-400">{`Latitude: ${data.latitude}`}</h2>

            <div className="relative">
              <div className={`relative ${isShowingFullDescription ? '' : 'h-[90px]'} overflow-hidden`}>
                <small className="font-sans leading-1 text-xs font-small">
                  {truncateDescription(data.description)}
                </small>
                {data.description.length > 100 && (
                  <button
                    onClick={() => setIsShowingFullDescription(!isShowingFullDescription)}
                    className="text-[#24c2a5] text-xs hover:underline ml-1"
                  >
                    See More
                  </button>
                )}
              </div>

              {isShowingFullDescription && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="bg-white p-6 rounded-lg max-w-2xl max-h-[80vh] overflow-y-auto">
                    <small className="font-sans leading-1 text-sm">
                      {data.description}
                    </small>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => setIsShowingFullDescription(false)}
                        className="text-[#24c2a5] hover:underline"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3">
            <div className="flex justify-between items-center">
              <small>Targeted Raise</small>
              <div className="flex mb-2 items-center gap-x-2">
                <img src={sui} alt="Sui" className="w-[1rem] h-[1rem]" />
                <h2>200,000</h2>
              </div>
            </div>
            <progress max="15" value={(Number(data.currentAmount) / Number(data.price)).toFixed(1)} />
          </div>

          <button
            className="mt-4 hidden md:block bg-[#24c2a5] w-full px-4 py-2 rounded-full text-white hover:border-solid hover:bg-white hover:text-[#24C2A5] transition-all duration-300"
            onClick={toggleMapModal}
          >
            View on Map
          </button>
          <Link
            to={`/map/${data.id}`}
            className="mt-4 md:hidden block"
            state={{ mapData: data }}
          >
            <button className="w-full bg-[#24c2a5] px-4 py-2 rounded-full text-white hover:border-solid hover:bg-white hover:text-[#24C2A5] transition-all duration-300">
              View on Map
            </button>
          </Link>

          <div className="flex justify-between items-center gap-4 pt-4">
            <div>
              <small className="font-semibold">Min.Entry</small>
              <h1 className="text-teal-500 font-semibold">2.95 SUI</h1>
            </div>
            <button
              className="hidden md:block bg-[#24c2a5] w-auto px-4 py-2 rounded-full text-white hover:border-solid hover:bg-white hover:text-[#24C2A5] transition-all duration-300"
              onClick={toggleModal}
            >
              INVEST
            </button>
            <Link to="/demo" className="md:hidden block">
              <button className="bg-[#24c2a5] w-auto px-4 py-2 rounded-full text-white hover:border-solid hover:bg-white hover:text-[#24C2A5] transition-all duration-300">
                INVEST
              </button>
            </Link>
          </div>
        </div>
      </div>
      <Timer dateTimestamp={Number(data.deadline)} />

      {/* Investment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
          <div
            ref={modalRef}
            className="bg-white p-8 rounded-lg shadow-lg w-[90%] max-w-md h-[90%] overflow-y-auto relative"
            style={{ pointerEvents: "auto" }}
          >
            <h2 className="text-xl font-bold mb-4">{data.name} - Investment</h2>
            <img
              src={`https://gateway.pinata.cloud/ipfs/${data.image}?pinataGatewayToken=${import.meta.env.VITE_GATEWAY_TOKEN}`}
              alt="Property"
              className="w-full h-40 object-cover rounded-lg mb-4"
            />

            {/* Property Details */}
            <div className="space-y-2">
              <p className="text-gray-600">
                <strong>Location:</strong> {data.location}
              </p>
              <p className="text-gray-600">
                <strong>Description:</strong> {data.description}
              </p>
              <p className="text-gray-600">
                <strong>Targeted Raise:</strong> 200,000 SUI
              </p>
              <p className="text-gray-600">
                <strong>Min. Entry:</strong> 2.95 SUI
              </p>
            </div>

            {/* Reasons to Invest */}
            <div className="mt-6 space-y-3">
              <h3 className="font-bold text-lg">Why Invest?</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>High demand in the area for residential properties.</li>
                <li>
                  Expected rise in property value over the next few years.
                </li>
                <li>
                  Environmentally friendly construction with green energy
                  systems.
                </li>
              </ul>
            </div>

            <span className="relative">
              <h1>Price:</h1>
              <input
                type="number"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                placeholder="Price"
                min="0"
                step="0.01"
                style={{
                  width: "100%",
                  backgroundColor: "#e5e7eb",
                  padding: "10px 18px",
                  borderRadius: "4px",
                  border: "1px",
                  outline: "none",
                  textAlign: "left",
                }}
              />
              <img
                src={sui}
                alt="Sui"
                className="w-[1.5rem] h-[1.5rem] absolute right-1 top-[2rem]"
              />
            </span>

            {/* Modal Actions */}
            <div className="mt-6 flex justify-between gap-4">
              <button
                className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                onClick={toggleModal}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 bg-[#24c2a5] text-white rounded-lg hover:bg-[#1da88d]"
                onClick={handleContribute}
                disabled={isContributing || !contributionAmount}
              >
                Confirm Investment
              </button>
            </div>

            {isAvailable && (
              <div className="w-[80%] h-[10rem] absolute top-[15rem] left-[10%] drop-shadow-md rounded-md z-50 bg-[#1da88d] text-white text-xl font-semibold p-4 text-center justify-center flex flex-col">
                <div
                  className="w-[2rem] h-[2rem] rounded-full bg-red-700 text-white font-bold text-2xl flex justify-center items-center mb-[2rem] cursor-pointer"
                  onClick={() => setIsAvailable(false)}
                >
                  X
                </div>
                {!isHome
                  ? "Investment page still under construction 🏗️"
                  : "Please connect wallet"}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Map Modal */}
      {isMapModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
          <div
            ref={modalRef}
            className="bg-white p-8 rounded-lg shadow-lg w-[90%] max-w-md h-[auto] overflow-y-auto relative"
            style={{ pointerEvents: "auto" }}
          >
            <h2 className="text-xl font-bold mb-4">{data.title} - Location</h2>
            <div className="h-[400px] w-full mb-4">
              <MapContainer
                center={[data.latitude, data.longitude]}
                zoom={13}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[data.latitude, data.longitude]}>
                  <Popup>
                    {data.title}
                    <br />
                    {data.latitude} {data.longitude}
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
            <button
              className="px-4 py-2 bg-[#24c2a5] text-white rounded-lg hover:bg-[#1da88d] w-full"
              onClick={toggleMapModal}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
