// ============================================================================
// Domain-Driven Design — Code Examples
// ============================================================================

const examples = {
  'aggregates-entities-value-objects': [
    {
      title: "Domain Event from Aggregate",
      description: "Raising domain events when aggregate state changes.",
      language: "javascript",
      code: `class AggregateRoot {
  #domainEvents = [];

  addDomainEvent(event) {
    this.#domainEvents.push({
      ...event,
      occurredAt: new Date(),
    });
  }

  pullDomainEvents() {
    const events = [...this.#domainEvents];
    this.#domainEvents = [];
    return events;
  }
}

class Order extends AggregateRoot {
  #status = 'draft';

  submit() {
    if (this.items.length === 0) throw new Error('Empty order');
    this.#status = 'submitted';
    this.addDomainEvent({
      type: 'OrderSubmitted',
      orderId: this.id,
      customerId: this.customerId,
      total: this.total.amount,
    });
  }

  cancel(reason) {
    if (this.#status === 'shipped') throw new Error('Cannot cancel shipped order');
    this.#status = 'cancelled';
    this.addDomainEvent({
      type: 'OrderCancelled',
      orderId: this.id,
      reason,
    });
  }
}

// In the repository / application service
async function submitOrder(orderId) {
  const order = await orderRepo.findById(orderId);
  order.submit();
  await orderRepo.save(order);

  // Publish domain events
  const events = order.pullDomainEvents();
  for (const event of events) {
    await eventBus.publish(event);
  }
}`,
      explanation: "Domain Events capture business-significant state changes. The Aggregate collects events internally, and the infrastructure publishes them after persistence. This decouples side effects (email, analytics) from the domain.",
      order_index: 1,
    },
  ],
};

export default examples;
