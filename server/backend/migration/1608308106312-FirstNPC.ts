import { MigrationInterface, QueryRunner } from 'typeorm'
import NonPlayableCharacter from '../entity/NonPlayableCharacter'

export class FirstNPC1608308106312 implements MigrationInterface {
  public async up (queryRunner: QueryRunner): Promise<void> {
    const npc = new NonPlayableCharacter()
    npc.name = 'Bertold'
    npc.imageSrc = 'bertold.png'
    npc.conversationOptions = {
      1: {
        question: 'Witaj, zgubiłem się. Co to za miejsce?',
        answer:
                    'Znajdujesz się w fortecy zakonu Wielkiego Stonogiasza. Żyjemy tutaj i służymy naszemu panu,' +
                    'ale tylko wybrani mogą ujrzeć jego prawdziwy obraz. Studiuje księgi i obmyśla strategię na nadchodzącą ' +
                    'wojnę, w której musimy stawić czoło hordom Kara-Khana.',
        evaluateMethod: null
      },
      2: {
        question: 'Potrzebuję ekwipunku, masz coś dla mnie?',
        answer:
                    'Nie sprzedajemy naszych wyrobów obcym, ale dobrze ci z oczu patrzy, więc dla ciebie zrobię wyjątek. ' +
                    'Tylko kiedy wybuchnie konflikt nie zapomnij kto podał ci pomocną dłoń.',
        evaluateMethod: () => console.log('npc pokazuje ekwipunek')
      },
      3: {
        question: 'Żegnaj.',
        answer: 'Niech Pavulan ma cię w opiece!',
        evaluateMethod: null
      }
    }
    npc.conversationOptionsTree = {
      1: [1, 2, 3],
      2: [1, 2, 3]
    }

    await npc.save()
  }

  public async down (queryRunner: QueryRunner): Promise<void> {}
}
