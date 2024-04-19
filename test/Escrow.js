const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Escrow', () => {

    let seller, buyer, inspector, lender
    let realEstate 
    let escrow

    beforeEach(async()=>{
        // Setup accounts
        [buyer , seller , inspector , lender] = await ethers.getSigners()
        
        // Deploy Real Estate
        const RealEstate=await ethers.getContractFactory('RealEstate')
        realEstate =await RealEstate.deploy()

        // Mint
        let transaction = await realEstate.connect(seller).mint("https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS")
        await transaction.wait()

        const Escrow = await ethers.getContractFactory('Escrow')
        escrow = await Escrow.deploy(
        realEstate.address,
        seller.address,
        inspector.address,
        lender.address
        )

        // Approve property
        transaction = await realEstate.connect(seller).approve(escrow.address, 1)
        await transaction.wait()

        // List Property
        transaction = await escrow.connect(seller).list(1, tokens(10), tokens(5), buyer.address )
        await transaction.wait()
    })

    describe('Deployment',()=>{
    
        it('Returns NFT Address', async()=>{
            const result =await escrow.nftAddress()
            expect(result).to.be.equal(realEstate.address)
        })

        it('Returns seller', async()=>{
           const  result = await escrow.seller()
           expect(result).to.be.equal(seller.address)
        })
        
        it('Returns inspector', async()=>{
            const  result = await escrow.inspector()
            expect(result).to.be.equal(inspector.address)
        })

        it('Returns lender', async()=>{
            const  result = await escrow.lender()
           expect(result).to.be.equal(lender.address)
        })
    
    })
   
    describe('Listing',()=>{
    
        it('Updates Ownership', async()=>{
            expect(await realEstate.ownerOf(1)).to.be.equal(escrow.address)
        })
    
        it('Updates as listed', async()=>{
            const result= await escrow.isListed(1)
            expect(result).to.be.equal(true)
        })

        it('Returns Purchase price', async()=>{
            const result= await escrow.purchasePrice(1)
            expect(result).to.be.equal(tokens(10))
        })

        it('Returns escrow Amount', async()=>{
            const result= await escrow.escrowAmount(1)
            expect(result).to.be.equal(tokens(5))
        })

        it('Returns buyer', async()=>{
            const result= await escrow.buyer(1)
            expect(result).to.be.equal(buyer.address)
        })
        
    })

    describe('Deposits',()=>{
      it('Updates contract balance',async()=>{
          const transaction= await escrow.connect(buyer).depositEarnest(1, { value: tokens(5)})
          await transaction.wait()
          const result=await escrow.getBalance();
          expect(result).to.be.equal(tokens(5))
      })
    })
    describe('Inspection',()=>{
        it('Updates contract balance',async()=>{
            const transaction= await escrow.connect(inspector).updateInspectionStatus(1, true)
            await transaction.wait()
            const result= await escrow.inspectionPassed(1)
            expect(result).to.be.equal(true)
           
        })
      })

})


