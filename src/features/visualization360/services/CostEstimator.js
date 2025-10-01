/**
 * Cost Estimation Calculator
 * Calculates material and labor costs for roofing and lighting projects
 * Phase 2 Feature
 */

export class CostEstimator {
  constructor() {
    // Pricing database (would come from backend in production)
    this.pricing = {
      shingles: {
        'weathered-wood': { perSquare: 145, name: 'Weathered Wood' },
        'midnight-black': { perSquare: 155, name: 'Midnight Black' },
        'storm-grey': { perSquare: 150, name: 'Storm Grey' },
        'antique-brown': { perSquare: 148, name: 'Antique Brown' },
        'terra-cotta': { perSquare: 160, name: 'Terra Cotta' },
        'forest-green': { perSquare: 158, name: 'Forest Green' },
        'autumn-red': { perSquare: 165, name: 'Autumn Red' }
      },
      underlayment: {
        perSquare: 25
      },
      iceWaterBarrier: {
        perLinearFoot: 3.50
      },
      ridgeVent: {
        perLinearFoot: 8.75
      },
      dripEdge: {
        perLinearFoot: 2.25
      },
      flashing: {
        perLinearFoot: 5.50
      },
      lighting: {
        rime: {
          trackPerFoot: 12.50,
          controllerBase: 299,
          powerSupply: 199,
          installationPerFoot: 8.00
        }
      },
      gutters: {
        kStyle: {
          perLinearFoot: 6.50,
          installationPerFoot: 3.00
        },
        halfRound: {
          perLinearFoot: 9.50,
          installationPerFoot: 4.00
        }
      },
      labor: {
        roofing: {
          perSquare: 85, // Tear-off and install
          minimumCharge: 500
        },
        lighting: {
          perFoot: 8.00,
          minimumCharge: 400
        },
        gutters: {
          perFoot: 3.00,
          minimumCharge: 200
        }
      },
      disposal: {
        perSquare: 15
      },
      permits: {
        flatFee: 250
      }
    };

    // Waste factors
    this.wasteFactor = {
      shingles: 1.10, // 10% waste
      underlayment: 1.10,
      lighting: 1.05, // 5% waste
      gutters: 1.05
    };

    // Tax rate (would be location-specific)
    this.taxRate = 0.07; // 7%
  }

  /**
   * Calculate complete project estimate
   */
  calculateEstimate(projectData) {
    const {
      measurements = {},
      shingleColor = 'weathered-wood',
      lightingLength = 0,
      gutterLength = 0,
      gutterStyle = 'kStyle',
      includeRidgeVent = true,
      includeGutters = false
    } = projectData;

    const estimate = {
      materials: {},
      labor: {},
      subtotal: 0,
      tax: 0,
      total: 0,
      breakdown: []
    };

    // Calculate roof area in squares (1 square = 100 sq ft)
    const roofAreaSqFt = measurements.roofArea || 2000;
    const squares = Math.ceil(roofAreaSqFt / 100);
    const squaresWithWaste = squares * this.wasteFactor.shingles;

    // Shingles
    const shingleCost = this.calculateShingleCost(shingleColor, squaresWithWaste);
    estimate.materials.shingles = shingleCost;
    estimate.breakdown.push({
      category: 'Materials',
      item: `Malarkey ${this.pricing.shingles[shingleColor].name} Shingles`,
      quantity: `${squares} sq`,
      unitPrice: this.pricing.shingles[shingleColor].perSquare,
      total: shingleCost.total
    });

    // Underlayment
    const underlaymentCost = this.calculateUnderlaymentCost(squaresWithWaste);
    estimate.materials.underlayment = underlaymentCost;
    estimate.breakdown.push({
      category: 'Materials',
      item: 'Synthetic Underlayment',
      quantity: `${squares} sq`,
      unitPrice: this.pricing.underlayment.perSquare,
      total: underlaymentCost.total
    });

    // Ridge Vent
    if (includeRidgeVent) {
      const ridgeLength = measurements.ridgeLength || roofAreaSqFt * 0.02;
      const ridgeCost = this.calculateRidgeVentCost(ridgeLength);
      estimate.materials.ridgeVent = ridgeCost;
      estimate.breakdown.push({
        category: 'Materials',
        item: 'Ridge Vent',
        quantity: `${ridgeLength.toFixed(0)} ft`,
        unitPrice: this.pricing.ridgeVent.perLinearFoot,
        total: ridgeCost.total
      });
    }

    // Drip Edge & Flashing
    const perimeter = measurements.perimeter || Math.sqrt(roofAreaSqFt) * 4;
    const dripEdgeCost = this.calculateDripEdgeCost(perimeter);
    estimate.materials.dripEdge = dripEdgeCost;
    estimate.breakdown.push({
      category: 'Materials',
      item: 'Drip Edge',
      quantity: `${perimeter.toFixed(0)} ft`,
      unitPrice: this.pricing.dripEdge.perLinearFoot,
      total: dripEdgeCost.total
    });

    // Lighting
    if (lightingLength > 0) {
      const lightingCost = this.calculateLightingCost(lightingLength);
      estimate.materials.lighting = lightingCost;
      estimate.breakdown.push({
        category: 'Materials',
        item: 'Rime Permanent Lighting System',
        quantity: `${lightingLength.toFixed(0)} ft`,
        unitPrice: this.pricing.lighting.rime.trackPerFoot,
        total: lightingCost.materials
      });

      estimate.breakdown.push({
        category: 'Materials',
        item: 'Rime Controller & Power Supply',
        quantity: '1 set',
        unitPrice: this.pricing.lighting.rime.controllerBase + this.pricing.lighting.rime.powerSupply,
        total: this.pricing.lighting.rime.controllerBase + this.pricing.lighting.rime.powerSupply
      });
    }

    // Gutters
    if (includeGutters && gutterLength > 0) {
      const gutterCost = this.calculateGutterCost(gutterLength, gutterStyle);
      estimate.materials.gutters = gutterCost;
      estimate.breakdown.push({
        category: 'Materials',
        item: `${gutterStyle === 'kStyle' ? 'K-Style' : 'Half-Round'} Gutters`,
        quantity: `${gutterLength.toFixed(0)} ft`,
        unitPrice: this.pricing.gutters[gutterStyle].perLinearFoot,
        total: gutterCost.materials
      });
    }

    // Labor - Roofing
    const roofingLabor = this.calculateRoofingLabor(squares);
    estimate.labor.roofing = roofingLabor;
    estimate.breakdown.push({
      category: 'Labor',
      item: 'Roof Tear-off & Installation',
      quantity: `${squares} sq`,
      unitPrice: this.pricing.labor.roofing.perSquare,
      total: roofingLabor.total
    });

    // Labor - Lighting
    if (lightingLength > 0) {
      const lightingLabor = this.calculateLightingLabor(lightingLength);
      estimate.labor.lighting = lightingLabor;
      estimate.breakdown.push({
        category: 'Labor',
        item: 'Lighting Installation',
        quantity: `${lightingLength.toFixed(0)} ft`,
        unitPrice: this.pricing.labor.lighting.perFoot,
        total: lightingLabor.total
      });
    }

    // Labor - Gutters
    if (includeGutters && gutterLength > 0) {
      const gutterLabor = this.calculateGutterLabor(gutterLength);
      estimate.labor.gutters = gutterLabor;
      estimate.breakdown.push({
        category: 'Labor',
        item: 'Gutter Installation',
        quantity: `${gutterLength.toFixed(0)} ft`,
        unitPrice: this.pricing.labor.gutters.perFoot,
        total: gutterLabor.total
      });
    }

    // Disposal
    const disposalCost = this.calculateDisposalCost(squares);
    estimate.materials.disposal = disposalCost;
    estimate.breakdown.push({
      category: 'Other',
      item: 'Debris Removal & Disposal',
      quantity: `${squares} sq`,
      unitPrice: this.pricing.disposal.perSquare,
      total: disposalCost.total
    });

    // Permits
    estimate.materials.permits = { total: this.pricing.permits.flatFee };
    estimate.breakdown.push({
      category: 'Other',
      item: 'Permits & Inspection',
      quantity: '1',
      unitPrice: this.pricing.permits.flatFee,
      total: this.pricing.permits.flatFee
    });

    // Calculate totals
    estimate.subtotal = estimate.breakdown.reduce((sum, item) => sum + item.total, 0);
    estimate.tax = estimate.subtotal * this.taxRate;
    estimate.total = estimate.subtotal + estimate.tax;

    // Add summary
    estimate.summary = {
      materialsCost: estimate.breakdown
        .filter(i => i.category === 'Materials' || i.category === 'Other')
        .reduce((sum, i) => sum + i.total, 0),
      laborCost: estimate.breakdown
        .filter(i => i.category === 'Labor')
        .reduce((sum, i) => sum + i.total, 0),
      roofArea: roofAreaSqFt,
      squares,
      costPerSquareFoot: estimate.total / roofAreaSqFt,
      taxRate: this.taxRate * 100
    };

    return estimate;
  }

  /**
   * Calculate shingle cost
   */
  calculateShingleCost(color, squares) {
    const pricePerSquare = this.pricing.shingles[color]?.perSquare || 150;
    const total = squares * pricePerSquare;

    return {
      quantity: squares,
      pricePerSquare,
      total,
      color
    };
  }

  /**
   * Calculate underlayment cost
   */
  calculateUnderlaymentCost(squares) {
    const total = squares * this.pricing.underlayment.perSquare;

    return {
      quantity: squares,
      pricePerSquare: this.pricing.underlayment.perSquare,
      total
    };
  }

  /**
   * Calculate ridge vent cost
   */
  calculateRidgeVentCost(linearFeet) {
    const total = linearFeet * this.pricing.ridgeVent.perLinearFoot;

    return {
      quantity: linearFeet,
      pricePerFoot: this.pricing.ridgeVent.perLinearFoot,
      total
    };
  }

  /**
   * Calculate drip edge cost
   */
  calculateDripEdgeCost(linearFeet) {
    const total = linearFeet * this.pricing.dripEdge.perLinearFoot;

    return {
      quantity: linearFeet,
      pricePerFoot: this.pricing.dripEdge.perLinearFoot,
      total
    };
  }

  /**
   * Calculate lighting cost
   */
  calculateLightingCost(linearFeet) {
    const lengthWithWaste = linearFeet * this.wasteFactor.lighting;

    const materials =
      (lengthWithWaste * this.pricing.lighting.rime.trackPerFoot) +
      this.pricing.lighting.rime.controllerBase +
      this.pricing.lighting.rime.powerSupply;

    const installation = linearFeet * this.pricing.lighting.rime.installationPerFoot;

    return {
      quantity: linearFeet,
      materials,
      installation,
      total: materials + installation
    };
  }

  /**
   * Calculate gutter cost
   */
  calculateGutterCost(linearFeet, style = 'kStyle') {
    const lengthWithWaste = linearFeet * this.wasteFactor.gutters;

    const materials = lengthWithWaste * this.pricing.gutters[style].perLinearFoot;
    const installation = linearFeet * this.pricing.gutters[style].installationPerFoot;

    return {
      quantity: linearFeet,
      style,
      materials,
      installation,
      total: materials + installation
    };
  }

  /**
   * Calculate roofing labor
   */
  calculateRoofingLabor(squares) {
    const laborCost = squares * this.pricing.labor.roofing.perSquare;
    const total = Math.max(laborCost, this.pricing.labor.roofing.minimumCharge);

    return {
      quantity: squares,
      pricePerSquare: this.pricing.labor.roofing.perSquare,
      total
    };
  }

  /**
   * Calculate lighting labor
   */
  calculateLightingLabor(linearFeet) {
    const laborCost = linearFeet * this.pricing.labor.lighting.perFoot;
    const total = Math.max(laborCost, this.pricing.labor.lighting.minimumCharge);

    return {
      quantity: linearFeet,
      pricePerFoot: this.pricing.labor.lighting.perFoot,
      total
    };
  }

  /**
   * Calculate gutter labor
   */
  calculateGutterLabor(linearFeet) {
    const laborCost = linearFeet * this.pricing.labor.gutters.perFoot;
    const total = Math.max(laborCost, this.pricing.labor.gutters.minimumCharge);

    return {
      quantity: linearFeet,
      pricePerFoot: this.pricing.labor.gutters.perFoot,
      total
    };
  }

  /**
   * Calculate disposal cost
   */
  calculateDisposalCost(squares) {
    const total = squares * this.pricing.disposal.perSquare;

    return {
      quantity: squares,
      pricePerSquare: this.pricing.disposal.perSquare,
      total
    };
  }

  /**
   * Apply discount
   */
  applyDiscount(estimate, discountPercent) {
    const discountAmount = estimate.subtotal * (discountPercent / 100);

    return {
      ...estimate,
      discount: {
        percent: discountPercent,
        amount: discountAmount
      },
      subtotal: estimate.subtotal - discountAmount,
      tax: (estimate.subtotal - discountAmount) * this.taxRate,
      total: (estimate.subtotal - discountAmount) * (1 + this.taxRate)
    };
  }

  /**
   * Generate financing options
   */
  generateFinancingOptions(totalAmount) {
    const interestRates = [0, 0.0499, 0.0699, 0.0899]; // 0%, 4.99%, 6.99%, 8.99%
    const terms = [12, 24, 36, 48, 60]; // months

    const options = [];

    interestRates.forEach(rate => {
      terms.forEach(term => {
        const monthlyPayment = this.calculateMonthlyPayment(totalAmount, rate, term);

        options.push({
          term,
          rate: rate * 100,
          monthlyPayment: monthlyPayment.toFixed(2),
          totalPaid: (monthlyPayment * term).toFixed(2),
          totalInterest: (monthlyPayment * term - totalAmount).toFixed(2)
        });
      });
    });

    return options;
  }

  /**
   * Calculate monthly payment for financing
   */
  calculateMonthlyPayment(principal, annualRate, months) {
    if (annualRate === 0) {
      return principal / months;
    }

    const monthlyRate = annualRate / 12;
    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);

    return payment;
  }

  /**
   * Update pricing (for admin/config)
   */
  updatePricing(category, item, newPrice) {
    if (this.pricing[category] && this.pricing[category][item]) {
      this.pricing[category][item] = newPrice;
      return true;
    }
    return false;
  }

  /**
   * Get price for specific item
   */
  getPrice(category, item, unit) {
    if (!this.pricing[category]) return null;

    if (item) {
      return this.pricing[category][item]?.[unit] || this.pricing[category][item];
    }

    return this.pricing[category][unit];
  }
}

// Singleton instance
export const costEstimator = new CostEstimator();
