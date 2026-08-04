import { describe, it, expect } from "vitest";
import { INITCODE_EIP7702_MARKER } from "@skandha/params/lib";
import { packUserOp } from "../../../src/services/EntryPointService/utils/packedUserOpUtils";
import { UserOperation } from "@skandha/types/lib/contracts/UserOperation";

const baseOp: UserOperation = {
  sender: "0x54E3d8E0F9800440581D6d82C7A85F1167090d98",
  nonce: "0x01",
  callData: "0x",
  callGasLimit: "0x3e93f",
  verificationGasLimit: "0x1aaf8",
  preVerificationGas: "0x10a2b",
  maxFeePerGas: "0xd59f80",
  maxPriorityFeePerGas: "0x1e8480",
  signature: "0x",
};

describe("packUserOp initCode packing", () => {
  it("keeps the EIP-7702 marker 0x7702 unpadded so paymaster signatures over keccak256(initCode) stay valid", () => {
    // Pimlico's singleton paymaster commits to keccak256(userOp.initCode) of the
    // canonical 2-byte marker. Padding it to 20 bytes changes the digest and the
    // op reverts with FailedOp("AA34 signature error") at bundle time.
    const packed = packUserOp({
      ...baseOp,
      factory: INITCODE_EIP7702_MARKER,
      factoryData: "0x",
    });
    expect(packed.initCode).toEqual(INITCODE_EIP7702_MARKER);
  });

  it("keeps the EIP-7702 marker unpadded regardless of prefix casing", () => {
    const packed = packUserOp({
      ...baseOp,
      factory: "0X7702" as `0x${string}`,
      factoryData: "0x",
    });
    expect(packed.initCode.toLowerCase()).toEqual(INITCODE_EIP7702_MARKER);
  });

  it("appends factoryData after the EIP-7702 marker", () => {
    const packed = packUserOp({
      ...baseOp,
      factory: INITCODE_EIP7702_MARKER,
      factoryData: "0xdeadbeef",
    });
    expect(packed.initCode).toEqual("0x7702deadbeef");
  });

  it("still packs a real 20-byte factory address followed by factoryData", () => {
    const packed = packUserOp({
      ...baseOp,
      factory: "0x5803c076563C85799989d42Fc00292A8aE52fa9E",
      factoryData: "0xcafe",
    });
    expect(packed.initCode.toLowerCase()).toEqual(
      "0x5803c076563c85799989d42fc00292a8ae52fa9ecafe"
    );
  });

  it("packs an empty initCode when there is no factory", () => {
    const packed = packUserOp({ ...baseOp });
    expect(packed.initCode).toEqual("0x");
  });
});
