const assert = require('assert');
import fuzzer from 'ot-fuzzer';

export default class CustomFuzzer {
    constructor({ otType, iterations = 100, generateRandomOp } = {}) {
        this.otType = otType;
        this.iterations = iterations;
        this.generateRandomOp = generateRandomOp;

        this.initialValue = this.otType.create();

        this.start = this.start.bind(this);
        this.singleTransformCheck = this.singleTransformCheck.bind(this);
        this.checkEqual = this.checkEqual.bind(this);
    }

    start(msg) {
        let val1 = this.initialValue;
        let val2 = this.initialValue;

        let currentIteration = 0;
        while (currentIteration < this.iterations) {
            const op1 = this.generateRandomOp(val1);
            const op2 = this.generateRandomOp(val2);
            const side = fuzzer.randomInt(1) === 1 ? 'left' : 'right';
            let otherSide = side === 'left' ? 'right' : 'left';

            const apply = this.otType.apply;
            const op1Transform = this.otType.transform(op1, op2, side);
            const op2Transform = this.otType.transform(op2, op1, otherSide);

            val1 = apply(apply(val1, op1), op2Transform);
            val2 = apply(apply(val2, op2), op1Transform);

            // break early if failed
            if (!this.checkEqual(val1, val2)) {
                return;
            }

            console.log(`========= PASSED ${currentIteration} =========`);
            currentIteration++;
        }
        console.log('PASSED ALL');
        return val1;
    }

    singleTransformCheck({ value = this.initialValue, op1, op2, side }) {
        const apply = this.otType.apply;
        let otherSide = side === 'left' ? 'right' : 'left';
        const op1Transform = this.otType.transform(op1, op2, side);
        const op2Transform = this.otType.transform(op2, op1, otherSide);

        const val1 = apply(apply(value, op1), op2Transform);
        const val2 = apply(apply(value, op2), op1Transform);

        return this.checkEqual(val1, val2);
    }

    checkEqual(val1, val2) {
        try {
            if (this.otType.serialize) {
                assert.deepStrictEqual(
                    this.otType.serialize(val1.document), 
                    this.otType.serialize(val2.document)
                );
            } else {
                assert.deepStrictEqual(val1, val2);
            }
            return true;
        } catch (err) {
            console.log('========= FAILED =========');
            console.log(err);
            console.log('========= VAL 1 =========');
            console.log(JSON.stringify(this.otType.serialize(val1.document), null, 2));
            console.log('========= VAL 2 =========');
            console.log(JSON.stringify(this.otType.serialize(val2.document), null, 2));
            return false;
        }
    };
}
