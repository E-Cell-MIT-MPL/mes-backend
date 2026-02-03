import axios from "axios";
import { env } from "../utils/envConfig.js";
import Ticket from "../models/Ticket.model.js";
import { encryptAtom, decryptAtom } from "../utils/atomAuth.js";

const getFormattedDate = () => {
  const d = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const initiatePayment = async ({ userId, eventName, amount, userEmail, userMobile }) => {
  try {
    const txnId = `MES${Date.now()}`;
    
    // 1. Create Ticket
    await Ticket.create({
      userId,
      eventName,
      qrData: "PENDING",
      txnId,
      amount,
      paymentStatus: "PENDING",
    });

    // 2. Payload
    const payload = {
      payInstrument: {
        headDetails: {
          version: "OTSv1.1",
          api: "AUTH",
          platform: "FLASH"
        },
        merchDetails: {
          merchId: env.ATOM_MERCH_ID,
          userId: "",
          password: env.ATOM_MERCH_PASS, 
          merchTxnId: txnId,
          merchTxnDate: getFormattedDate()
        },
        payDetails: {
          amount: "13", // 👈 Change this to 1.00 for testing
          product: env.ATOM_PROD_ID,
          custAccNo: "1234567890",
          txnCurrency: "INR"
        },
        custDetails: {
          custEmail: userEmail || "test@example.com",
          custMobile: userMobile || "9999999999"
        },
        extras: {
          udf1: eventName,
          udf2: userId,
          udf3: "MES2026",
          udf4: "",
          udf5: ""
        }
      }
    };

    const encryptedData = encryptAtom(payload);
    console.log("encrypteddata",encryptedData);
    
    const params = new URLSearchParams();
    params.append('merchId', env.ATOM_MERCH_ID);
    params.append('encData', encryptedData);

    console.log("🔵 Sending to Atom URL:", env.ATOM_PAYMENT_URL);
    console.log(params);

    const response = await axios.post("https://payment1.atomtech.in/ots/aipay/auth?encData=EEAD508EC587D8CA75AA811D0DF3FBA1B066ECDBFBA53944C300D4A8545F803D2DBEE42A8817C398009C89C7955ED642D27B0155961ACCF7353C0C36207E7178CE21C3D549A82C5ECA5973D275C39C04327CEB0E9EA186D301AE7B9CC40D299FADD94A8EA172CA217533113B25F964D6DA50122B75C5EEDBFDA4A0772BCE698C9EBDC848CB60B4A11E90A319B9914CBD5C201FF61E2D51BDBE4E237044A5FBACB73B4E6F7D4BBAFF56398487F22B47A8302C15D81C9E06B52D77E608EFAC80EE966EC215D11948E1F2E33FCEB1E254684F659BD1AA3B7424514C47942E095F99719B352064679F96C09B56EF6406FD66965D6B21842FBF45F3AAE4F2B11B05D5B340D828933387DA63012463828B5E34F5840E4567759D3B317D7C8607F74088CFAC83FA18C761F73D13AD96FF8164B9887199BB2F9C86A9CD1B8CE4314E5B1D86C91CBF6ABA65032965E4CBA00069FF868199A2BE6B9E4DA61A7FBB4ADB080728AD90F8A30EA9FAF62136B09B7F57C14143CCB6801F14A9558E813201099FCB79324450CFFDAEDD35F4CEB5299ECCD5E548524E6AF88CB45BF519BC1F4694519D28914E80D0B6A90AFC22C07E93F9EA20AEA82CA23C367AFC19DDB7A911F989ED07F7C993AE3E4CDF84B2F3EA62D136CADD93B3DFB2A65B0B1A7DE34C5CB3D572E17C18D0E2AE4CC799C6D82DC81C1E6F89578DF733EFE054617EEFF44733D5CDB77BB988DACD780927FC5B0EC825F42C038EBC6C3AA7CAEAF14878387A526F&merchId=571016",{
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    // 👇 DEBUGGING LOGS (Check your terminal for this!)
    console.log("🟡 RAW ATOM RESPONSE STATUS:", response.status);
    console.log("🟡 RAW ATOM RESPONSE DATA:", response.data); 

    const resData = response.data;
    
    // Check if response is JSON (Error) or String (Success/Error)
    if (typeof resData === 'object') {
         console.error("❌ Atom returned JSON error:", JSON.stringify(resData));
         throw new Error("Atom returned an error object: " + JSON.stringify(resData));
    }

    const urlParams = new URLSearchParams(resData);
    const encResponse = urlParams.get('encData');

    if (!encResponse) {
        // This will now show us exactly what Atom said
        throw new Error(`Atom response missing encData. Raw response: ${resData}`);
    }

    const decrypted = decryptAtom(encResponse);
    console.log("🟢 Decrypted Atom Response:", decrypted);

    if (decrypted && decrypted.atomTokenId) {
        return {
            atomTokenId: decrypted.atomTokenId,
            merchId: env.ATOM_MERCH_ID,
            txnId: txnId
        };
    } else {
        throw new Error("Token generation failed");
    }

  } catch (error) {
    console.error("❌ Payment Error:", error.message);
    throw error;
  }
};

export const handlePaymentCallback = async (data) => {
    return { success: true };
};
