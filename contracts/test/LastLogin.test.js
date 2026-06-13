import { expect } from "chai";
import hre from "hardhat";

describe("LastLogin", function () {
  async function deploy() {
    const [owner, g1, g2, g3, ben1, ben2] = await hre.ethers.getSigners();
    const beneficiaries = [
      { wallet: ben1.address, bps: 6000 },
      { wallet: ben2.address, bps: 4000 },
    ];
    const c = await hre.ethers.deployContract(
      "LastLogin",
      [[g1.address, g2.address, g3.address], beneficiaries],
      { value: hre.ethers.parseEther("1") }
    );
    await c.waitForDeployment();
    return { c, owner, g1, g2, g3, ben1, ben2 };
  }

  it("starts ACTIVE and records proof-of-life", async () => {
    const { c, owner } = await deploy();
    expect(await c.getState()).to.equal(0n); // ACTIVE
    await expect(c.connect(owner).proveLife()).to.emit(c, "ProofOfLife");
  });

  it("anchors a vault integrity hash", async () => {
    const { c, owner } = await deploy();
    const h = hre.ethers.id("encrypted-vault-snapshot-v1");
    await expect(c.connect(owner).setVaultHash(h)).to.emit(c, "VaultHashUpdated");
    expect(await c.vaultHash()).to.equal(h);
  });

  it("executes the estate after 2-of-3 guardians and splits funds correctly", async () => {
    const { c, g1, g2, ben1, ben2 } = await deploy();
    const before1 = await hre.ethers.provider.getBalance(ben1.address);
    const before2 = await hre.ethers.provider.getBalance(ben2.address);

    await c.connect(g1).confirmDeath();
    expect(await c.getState()).to.equal(0n); // still ACTIVE after 1
    await expect(c.connect(g2).confirmDeath()).to.emit(c, "Executed");
    expect(await c.getState()).to.equal(1n); // EXECUTING

    const after1 = await hre.ethers.provider.getBalance(ben1.address);
    const after2 = await hre.ethers.provider.getBalance(ben2.address);
    expect(after1 - before1).to.equal(hre.ethers.parseEther("0.6"));
    expect(after2 - before2).to.equal(hre.ethers.parseEther("0.4"));
  });

  it("rejects non-guardians and double confirmations", async () => {
    const { c, owner, g1 } = await deploy();
    await expect(c.connect(owner).confirmDeath()).to.be.revertedWith("not a guardian");
    await c.connect(g1).confirmDeath();
    await expect(c.connect(g1).confirmDeath()).to.be.revertedWith("already confirmed");
  });
});
